from pathlib import Path
from datetime import datetime
from app.database.database import get_db_connection, record_log
from app.utils.certificate_id import generate_certificate_id
from app.utils.file_manager import copy_to_root_output
from app.services.pdf_service import generate_pdf_certificate

def generate_certificates_for_students(
    student_ids: list = None,
    template_name: str = "Standard",
    force_all: bool = False,
    institution_name: str = None,
    cert_title: str = None,
    signatory_name: str = None,
    signatory_title: str = None
):
    """
    Generates high-resolution vector PDF certificates for students,
    updates database records, copies files to output directory,
    and logs the generation event for error auditing.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    if student_ids and len(student_ids) > 0:
        placeholders = ','.join('?' for _ in student_ids)
        cursor.execute(f"SELECT * FROM students WHERE id IN ({placeholders})", student_ids)
        students = cursor.fetchall()
    elif force_all:
        cursor.execute("SELECT * FROM students")
        students = cursor.fetchall()
    else:
        # Generate for all pending or registered students
        cursor.execute("SELECT * FROM students WHERE status = 'Pending' OR status = 'Registered'")
        students = cursor.fetchall()
        if not students:
            # If none pending, generate for all
            cursor.execute("SELECT * FROM students")
            students = cursor.fetchall()

    generated_list = []
    error_list = []
    total_requested = len(students)

    for student in students:
        s_id = student["id"]
        s_name = student["name"]
        s_course = student["course"]
        s_grade = student["grade"]
        s_date = student["issue_date"]
        
        # Reuse existing cert id if present, else generate new
        cert_id = student["certificate_id"] or generate_certificate_id()

        try:
            # Generate PDF with selected custom template
            pdf_path = generate_pdf_certificate(
                cert_id=cert_id,
                student_name=s_name,
                course_name=s_course,
                grade=s_grade,
                issue_date=s_date,
                template_name=template_name,
                institution_name=institution_name,
                cert_title=cert_title,
                signatory_name=signatory_name,
                signatory_title=signatory_title
            )

            pdf_filename = Path(pdf_path).name
            copy_to_root_output(pdf_path, pdf_filename)

            # Update student record
            cursor.execute(
                "UPDATE students SET status = 'Generated', certificate_id = ? WHERE id = ?",
                (cert_id, s_id)
            )

            # Check if certificate record exists
            cursor.execute("SELECT id FROM certificates WHERE certificate_id = ?", (cert_id,))
            existing_cert = cursor.fetchone()

            if existing_cert:
                cursor.execute(
                    """UPDATE certificates 
                       SET pdf_path = ?, template_name = ?, student_name = ?, course_name = ?, grade = ?, issue_date = ? 
                       WHERE certificate_id = ?""",
                    (pdf_path, template_name, s_name, s_course, s_grade, s_date, cert_id)
                )
            else:
                cursor.execute(
                    """INSERT INTO certificates 
                    (certificate_id, student_id, student_name, course_name, grade, issue_date, pdf_path, template_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (cert_id, s_id, s_name, s_course, s_grade, s_date, pdf_path, template_name)
                )

            generated_list.append({
                "certificate_id": cert_id,
                "student_id": s_id,
                "student_name": s_name,
                "course_name": s_course,
                "template_name": template_name,
                "pdf_path": pdf_path
            })
        except Exception as e:
            error_list.append({
                "student_id": s_id,
                "student_name": s_name,
                "error": str(e)
            })

    conn.commit()
    conn.close()

    # Record generation log in DB
    event_type = "BULK_GENERATION" if total_requested > 1 else "SINGLE_GENERATION"
    log_status = "SUCCESS" if len(error_list) == 0 else ("WARNING" if len(generated_list) > 0 else "FAILED")
    
    details = f"Generated: {len(generated_list)}/{total_requested}. Template: {template_name}. Errors: {len(error_list)}."
    record_log(
        event_type=event_type,
        status=log_status,
        total_records=total_requested,
        success_count=len(generated_list),
        error_count=len(error_list),
        details=details
    )

    return generated_list
