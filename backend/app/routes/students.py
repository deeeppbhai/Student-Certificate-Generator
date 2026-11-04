import random
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Response, Query
from fastapi.responses import StreamingResponse
from app.database.database import get_db_connection, record_log, reset_student_and_certificate_data
from app.schemas.student_schema import StudentCreate
from app.services.excel_service import validate_and_parse_excel, generate_sample_excel_template
from app.services.certificate_service import generate_certificates_for_students
from app.utils.file_manager import save_uploaded_file, clean_all_certificates

router = APIRouter(prefix="/api/students", tags=["Students"])

@router.get("")
def get_students():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students ORDER BY id DESC")
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students

@router.post("")
def create_student(student: StudentCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        stu_id = (student.student_id and student.student_id.strip()) or f"STU-{random.randint(100, 999)}"
        cursor.execute("SELECT id FROM students WHERE student_id = ?", (stu_id,))
        existing = cursor.fetchone()

        if existing:
            stu_row_id = existing["id"]
            cursor.execute(
                """UPDATE students 
                   SET name = ?, email = ?, course = ?, grade = ?, issue_date = ?, status = 'Pending'
                   WHERE id = ?""",
                (student.name, student.email, student.course, student.grade, student.issue_date, stu_row_id)
            )
            action_desc = "Updated"
        else:
            cursor.execute(
                """INSERT INTO students (student_id, name, email, course, grade, issue_date, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (stu_id, student.name, student.email, student.course, student.grade, student.issue_date, "Pending")
            )
            stu_row_id = cursor.lastrowid
            action_desc = "Created"

        conn.commit()
        conn.close()
        
        record_log(
            event_type="STUDENT_CREATE",
            status="SUCCESS",
            total_records=1,
            success_count=1,
            error_count=0,
            details=f"{action_desc} student record: {student.name} ({stu_id})"
        )
        return {"message": f"Student {action_desc.lower()} successfully", "id": stu_row_id, "student_id": stu_id}
    except Exception as e:
        conn.close()
        record_log("STUDENT_CREATE", "FAILED", total_records=1, error_count=1, details=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/sample-excel")
def download_sample_excel():
    """Download a standardized sample Excel template with valid columns and format"""
    excel_bytes = generate_sample_excel_template()
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_sample_template.xlsx"}
    )

@router.post("/clear-all")
def clear_all_students_and_certificates():
    """Clear all student records, certificate records, and generated PDF files"""
    reset_student_and_certificate_data()
    clean_all_certificates()
    record_log("DATA_RESET", "SUCCESS", details="Cleared all student records and generated certificates.")
    return {"message": "All student and certificate records successfully cleared."}

@router.post("/upload-excel")
async def upload_students_excel(
    files: Optional[List[UploadFile]] = File(None),
    file: Optional[UploadFile] = File(None),
    template: str = Query("Standard"),
    clean_previous: bool = Query(True, description="Clean reset previous records before processing batch")
):
    """
    Upload single or multiple Excel spreadsheets, run multi-field data validation,
    and generate certificates for all eligible student records across all uploaded files.
    """
    upload_list = []
    if files:
        upload_list.extend([f for f in files if f and f.filename])
    if file and file.filename and file not in upload_list:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(status_code=400, detail="No Excel file uploaded. Please select one or more .xlsx or .xls files.")

    for f in upload_list:
        fname = (f.filename or "").lower()
        if not (fname.endswith(".xlsx") or fname.endswith(".xls")):
            raise HTTPException(status_code=400, detail=f"File '{f.filename}' is not an Excel spreadsheet (.xlsx or .xls required).")

    # Clean reset previous records if requested so certificates strictly match the uploaded files
    if clean_previous:
        reset_student_and_certificate_data()
        clean_all_certificates()

    total_scanned = 0
    valid_count = 0
    invalid_count = 0
    imported_count = 0
    all_student_ids = []
    all_errors = []
    all_warnings = []
    processed_filenames = []

    for f in upload_list:
        contents = await f.read()
        save_uploaded_file(contents, f.filename or "students.xlsx")
        processed_filenames.append(f.filename)

        try:
            val_result = validate_and_parse_excel(contents)
            total_scanned += val_result.get("total_scanned", 0)
            valid_count += val_result.get("valid_count", 0)
            invalid_count += val_result.get("invalid_count", 0)
            imported_count += val_result.get("imported_count", 0)

            for sid in val_result.get("processed_student_ids", []):
                if sid not in all_student_ids:
                    all_student_ids.append(sid)

            for err in val_result.get("errors", []):
                all_errors.append(f"[{f.filename}] {err}" if len(upload_list) > 1 else err)
            for warn in val_result.get("warnings", []):
                all_warnings.append(f"[{f.filename}] {warn}" if len(upload_list) > 1 else warn)

        except Exception as e:
            all_errors.append(f"[{f.filename}] {str(e)}" if len(upload_list) > 1 else str(e))
            invalid_count += 1

    try:
        generated_results = []
        if all_student_ids:
            generated_results = generate_certificates_for_students(
                student_ids=all_student_ids,
                template_name=template or "Standard",
                force_all=False
            )

        cert_ids = [c["certificate_id"] for c in generated_results if "certificate_id" in c]
        cert_ids_param = ",".join(cert_ids)
        batch_zip_url = f"/api/download/batch-zip?cert_ids={cert_ids_param}" if cert_ids else "/api/download/all-zip"

        single_pdf_url = (
            f"/api/download/{generated_results[0]['certificate_id']}"
            if len(generated_results) == 1
            else batch_zip_url
        )

        file_summary_str = f"'{processed_filenames[0]}'" if len(processed_filenames) == 1 else f"{len(processed_filenames)} spreadsheets ({', '.join(processed_filenames[:3])}{'...' if len(processed_filenames) > 3 else ''})"
        status_str = "VALID" if invalid_count == 0 else "PARTIALLY_VALID" if valid_count > 0 else "INVALID"

        return {
            "message": f"Excel validation complete: {valid_count} record(s) imported from {file_summary_str} and {len(generated_results)} official certificate(s) generated!",
            "total_scanned": total_scanned,
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "imported_count": imported_count,
            "generated_count": len(generated_results),
            "status": status_str,
            "errors": all_errors,
            "warnings": all_warnings,
            "student_ids": all_student_ids,
            "certificates": generated_results,
            "single_pdf_url": single_pdf_url,
            "batch_zip_url": batch_zip_url,
            "zip_download_url": batch_zip_url,
            "uploaded_filename": ", ".join(processed_filenames),
            "uploaded_filenames": processed_filenames,
            "multiple_files": len(processed_filenames) > 1
        }
    except Exception as e:
        record_log("EXCEL_UPLOAD", "FAILED", error_count=1, details=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auto-import-local-excel")
def auto_import_local_excel_from_pc():
    """Automatically locate Excel datasets on PC, validate data, and generate all certificates"""
    base_dir = Path(__file__).parent.parent.parent.parent
    possible_paths = [
        base_dir / "data" / "students.xlsx",
        base_dir / "data" / "single_student.xlsx",
        base_dir / "backend" / "uploads" / "students.xlsx",
        Path(r"e:\scg\data\students.xlsx"),
        Path(r"e:\scg\data\single_student.xlsx")
    ]
    
    found_path = None
    for p in possible_paths:
        if p.exists():
            found_path = p
            break
            
    if not found_path:
        raise HTTPException(status_code=404, detail="No local Excel file found in data/ or backend/uploads/.")
        
    with open(found_path, "rb") as f:
        file_bytes = f.read()
        
    try:
        val_result = validate_and_parse_excel(file_bytes)
        student_ids = val_result["processed_student_ids"]
        generated_results = generate_certificates_for_students(student_ids=student_ids, force_all=True)
        
        single_pdf_url = f"/api/download/{generated_results[0]['certificate_id']}" if len(generated_results) == 1 else "/api/download/all-zip"
        return {
            "message": f"Successfully auto-imported '{found_path.name}' with data validation! Generated {len(generated_results)} certificates.",
            "validation": val_result,
            "imported_count": val_result["imported_count"],
            "generated_count": len(generated_results),
            "single_pdf_url": single_pdf_url,
            "zip_download_url": "/api/download/all-zip",
            "certificates": generated_results
        }
    except Exception as e:
        record_log("AUTO_IMPORT", "FAILED", error_count=1, details=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{student_id}")
def delete_student(student_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM certificates WHERE student_id = ?", (student_id,))
    cursor.execute("DELETE FROM students WHERE id = ?", (student_id,))
    conn.commit()
    conn.close()
    record_log("STUDENT_DELETE", "SUCCESS", total_records=1, success_count=1, details=f"Deleted student ID: {student_id}")
    return {"message": "Student record deleted successfully"}
