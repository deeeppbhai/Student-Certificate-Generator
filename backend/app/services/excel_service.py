import re
import random
from io import BytesIO
from datetime import datetime
import pandas as pd
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from app.database.database import get_db_connection, record_log

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
VALID_GRADES = {"A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D", "O", "OUTSTANDING", "DISTINCTION", "MERIT", "PASS", "FIRST CLASS"}

def validate_and_parse_excel(file_content: bytes):
    """
    Parses an uploaded Excel file and performs thorough data validation.
    Returns a structured validation result including valid row count,
    rejected row count, detailed row-by-row error list, and imported student IDs.
    """
    try:
        df = pd.read_excel(BytesIO(file_content))
    except Exception as e:
        record_log(
            event_type="EXCEL_IMPORT",
            status="FAILED",
            total_records=0,
            success_count=0,
            error_count=1,
            details=f"Failed to read Excel file: {str(e)}"
        )
        raise ValueError(f"Could not parse Excel spreadsheet: {str(e)}")

    if df.empty:
        record_log(
            event_type="EXCEL_IMPORT",
            status="FAILED",
            total_records=0,
            success_count=0,
            error_count=1,
            details="The uploaded Excel sheet contains no data rows."
        )
        raise ValueError("The uploaded Excel spreadsheet is empty.")

    # Standardize and normalize column headers (strip spaces, lowercase, and alphanumeric normalization)
    cols = {str(col).strip().lower(): col for col in df.columns}
    cols_norm = {re.sub(r'[^a-z0-9]', '', str(col).lower()): col for col in df.columns}

    # Intelligent Column Mapping with fuzzy fallback
    name_col = next((cols[k] for k in ["name", "student_name", "student name", "full_name", "fullname", "candidate_name", "candidate", "student"] if k in cols), None)
    if not name_col:
        name_col = next((cols_norm[k] for k in ["studentname", "fullname", "candidatename", "learnername", "participantname", "name", "student", "candidate"] if k in cols_norm), None)

    email_col = next((cols[k] for k in ["email", "email_address", "student email", "candidate_email", "e-mail", "mail"] if k in cols), None)
    if not email_col:
        email_col = next((cols_norm[k] for k in ["email", "emailaddress", "studentemail", "candidateemail", "mail"] if k in cols_norm), None)

    course_col = next((cols[k] for k in ["course", "course_name", "program", "course title", "subject", "track", "program_name", "degree", "branch", "department"] if k in cols), None)
    if not course_col:
        course_col = next((cols_norm[k] for k in ["course", "coursename", "program", "programname", "coursetitle", "subject", "track", "degree", "branch", "department", "certification"] if k in cols_norm), None)

    grade_col = next((cols[k] for k in ["grade", "score", "result", "performance", "marks", "evaluation", "percentage", "cgpa", "gpa"] if k in cols), None)
    if not grade_col:
        grade_col = next((cols_norm[k] for k in ["grade", "score", "result", "performance", "marks", "evaluation", "percentage", "cgpa", "gpa"] if k in cols_norm), None)

    date_col = next((cols[k] for k in ["issue_date", "date", "issue date", "completion_date", "awarded_date", "completion date"] if k in cols), None)
    if not date_col:
        date_col = next((cols_norm[k] for k in ["issuedate", "date", "completiondate", "awardeddate", "awarddate", "graduationdate"] if k in cols_norm), None)

    id_col = next((cols[k] for k in ["student_id", "id", "roll_no", "roll no", "registration_no", "candidate_id", "reg_no", "roll_number"] if k in cols), None)
    if not id_col:
        id_col = next((cols_norm[k] for k in ["studentid", "id", "rollno", "rollnumber", "registrationno", "regno", "candidateid", "enrollmentno"] if k in cols_norm), None)

    if not name_col or not course_col:
        missing = []
        if not name_col:
            missing.append("'Name' (or 'Student Name')")
        if not course_col:
            missing.append("'Course' (or 'Program')")
        detected = [str(c) for c in df.columns]
        error_msg = f"Excel schema validation failed: Missing required column(s): {', '.join(missing)}. Detected columns: {', '.join(detected) if detected else 'None'}."
        record_log(
            event_type="EXCEL_IMPORT",
            status="FAILED",
            total_records=len(df),
            success_count=0,
            error_count=len(df),
            details=error_msg
        )
        raise ValueError(error_msg)

    conn = get_db_connection()
    cursor = conn.cursor()

    total_scanned = 0
    valid_count = 0
    invalid_count = 0
    errors = []
    warnings = []
    processed_student_ids = []
    seen_ids_in_file = set()

    today_str = datetime.now().strftime("%Y-%m-%d")

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed Excel row (header is 1)
        
        # Check if entire row is empty
        if row.isna().all():
            continue

        total_scanned += 1
        row_has_fatal_error = False
        row_errors = []

        # 1. Validate Student Name
        raw_name = row[name_col]
        if pd.isna(raw_name) or not str(raw_name).strip():
            row_errors.append({"field": "Name", "value": "", "message": "Student Name is required and cannot be blank."})
            row_has_fatal_error = True
            s_name = ""
        else:
            s_name = str(raw_name).strip()
            if len(s_name) < 2:
                row_errors.append({"field": "Name", "value": s_name, "message": "Student Name is too short (minimum 2 characters required)."})
                row_has_fatal_error = True

        # 2. Validate Course
        raw_course = row[course_col]
        if pd.isna(raw_course) or not str(raw_course).strip():
            row_errors.append({"field": "Course", "value": "", "message": "Course program is required and cannot be blank."})
            row_has_fatal_error = True
            s_course = ""
        else:
            s_course = str(raw_course).strip()

        # 3. Validate / Sanitize Email
        raw_email = row[email_col] if email_col else None
        if raw_email is not None and pd.notna(raw_email) and str(raw_email).strip():
            s_email = str(raw_email).strip()
            if not EMAIL_REGEX.match(s_email):
                row_errors.append({"field": "Email", "value": s_email, "message": f"Invalid email format: '{s_email}'."})
                # Non-fatal if we fallback, but flag error
                s_email = f"{s_name.lower().replace(' ', '.')}@example.com" if s_name else "student@example.com"
        else:
            clean_prefix = re.sub(r'[^a-zA-Z0-9]', '.', s_name.lower()) if s_name else f"student{row_num}"
            s_email = f"{clean_prefix}@scg.edu"
            warnings.append({"row": row_num, "field": "Email", "message": f"Email was blank; generated fallback '{s_email}'."})

        # 4. Validate Grade
        raw_grade = row[grade_col] if grade_col else None
        if raw_grade is not None and pd.notna(raw_grade) and str(raw_grade).strip():
            s_grade = str(raw_grade).strip().upper()
        else:
            s_grade = "A+"
            warnings.append({"row": row_num, "field": "Grade", "message": "Grade was missing; default 'A+' applied."})

        # 5. Validate Issue Date
        raw_date = row[date_col] if date_col else None
        if raw_date is not None and pd.notna(raw_date):
            try:
                parsed_date = pd.to_datetime(raw_date)
                s_date = parsed_date.strftime("%Y-%m-%d")
            except Exception:
                row_errors.append({"field": "Issue Date", "value": str(raw_date), "message": f"Invalid date format '{raw_date}'. Expected YYYY-MM-DD."})
                s_date = today_str
        else:
            s_date = today_str

        # 6. Validate Student ID & Duplicate Detection
        raw_id = row[id_col] if id_col else None
        if raw_id is not None and pd.notna(raw_id) and str(raw_id).strip():
            s_id = str(raw_id).strip()
            if s_id in seen_ids_in_file:
                warnings.append({"row": row_num, "field": "Student ID", "message": f"Duplicate Student ID '{s_id}' detected in spreadsheet."})
            seen_ids_in_file.add(s_id)
        else:
            s_id = f"STU-{random.randint(1000, 9999)}"

        if row_has_fatal_error:
            invalid_count += 1
            for err in row_errors:
                errors.append({
                    "row": row_num,
                    "student_name": s_name or "Unknown",
                    "field": err["field"],
                    "value": err["value"],
                    "message": err["message"]
                })
            continue

        # If any non-fatal errors occurred on this row, still log them
        for err in row_errors:
            errors.append({
                "row": row_num,
                "student_name": s_name,
                "field": err["field"],
                "value": err["value"],
                "message": err["message"]
            })

        # Database Check & Insertion
        try:
            cursor.execute(
                "SELECT id FROM students WHERE student_id = ? OR (name = ? AND course = ?)",
                (s_id, s_name, s_course)
            )
            existing = cursor.fetchone()

            if not existing:
                cursor.execute(
                    """INSERT INTO students 
                    (student_id, name, email, course, grade, issue_date, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?)""",
                    (s_id, s_name, s_email, s_course, s_grade, s_date, "Pending")
                )
                student_row_id = cursor.lastrowid
                valid_count += 1
            else:
                student_row_id = existing["id"]
                # Mark as pending to allow re-issuing if needed
                cursor.execute(
                    "UPDATE students SET status = 'Pending', grade = ?, issue_date = ? WHERE id = ?",
                    (s_grade, s_date, student_row_id)
                )
                valid_count += 1

            processed_student_ids.append(student_row_id)
        except Exception as insert_err:
            invalid_count += 1
            errors.append({
                "row": row_num,
                "student_name": s_name,
                "field": "Database",
                "value": s_id,
                "message": f"Database insertion error: {str(insert_err)}"
            })

    conn.commit()
    conn.close()

    # Determine overall status
    if invalid_count == 0:
        overall_status = "SUCCESS"
    elif valid_count > 0:
        overall_status = "WARNING"
    else:
        overall_status = "FAILED"

    log_details = f"Imported: {valid_count}/{total_scanned}. Errors: {len(errors)}. Warnings: {len(warnings)}."
    record_log(
        event_type="EXCEL_IMPORT",
        status=overall_status,
        total_records=total_scanned,
        success_count=valid_count,
        error_count=invalid_count,
        details=log_details
    )

    return {
        "total_scanned": total_scanned,
        "valid_count": valid_count,
        "invalid_count": invalid_count,
        "imported_count": valid_count,
        "status": overall_status,
        "errors": errors,
        "warnings": warnings,
        "processed_student_ids": processed_student_ids
    }

def parse_and_import_students_excel(file_content: bytes):
    """
    Backward-compatible wrapper for previous calls.
    Returns (imported_count, processed_student_ids).
    """
    result = validate_and_parse_excel(file_content)
    return result["imported_count"], result["processed_student_ids"]

def generate_sample_excel_template() -> bytes:
    """
    Generates a beautifully styled, downloadable sample Excel template
    ready for student batch certificate imports.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Student Registry"

    # Styling definitions
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(name="Segoe UI", size=11, bold=True, color="D4AF37")
    sub_font = Font(name="Segoe UI", size=10, color="1E293B")
    border_side = Side(style='thin', color="CBD5E1")
    cell_border = Border(left=border_side, right=border_side, top=border_side, bottom=border_side)
    center_align = Alignment(horizontal="center", vertical="center")
    left_align = Alignment(horizontal="left", vertical="center")

    headers = [
        "Student ID",
        "Student Name",
        "Email Address",
        "Course Program",
        "Grade",
        "Issue Date"
    ]

    ws.append(headers)
    for col_idx in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = cell_border
    ws.row_dimensions[1].height = 28

    sample_rows = [
        ("STU-1001", "Aarav Sharma", "aarav.sharma@example.com", "Artificial Intelligence & ML", "A+", "2026-10-15"),
        ("STU-1002", "Diya Sengupta", "diya.sengupta@example.com", "Full Stack Web Development", "O", "2026-10-16"),
        ("STU-1003", "Kabir Nair", "kabir.nair@example.com", "Cloud Architecture & DevOps", "A", "2026-10-17"),
        ("STU-1004", "Meera Joshi", "meera.joshi@example.com", "Cyber Security & Cryptography", "A+", "2026-10-18"),
        ("STU-1005", "Vikram Malhotra", "vikram.malhotra@example.com", "Data Science & Big Data", "Distinction", "2026-10-19"),
    ]

    for row_idx, row_data in enumerate(sample_rows, start=2):
        ws.append(row_data)
        ws.row_dimensions[row_idx].height = 22
        for col_idx in range(1, len(row_data) + 1):
            c = ws.cell(row=row_idx, column=col_idx)
            c.font = sub_font
            c.border = cell_border
            c.alignment = center_align if col_idx in [1, 5, 6] else left_align

    # Auto-adjust column widths
    column_widths = [16, 24, 30, 32, 14, 16]
    for idx, width in enumerate(column_widths, start=1):
        col_letter = openpyxl.utils.get_column_letter(idx)
        ws.column_dimensions[col_letter].width = width

    output = BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()
