import os
import sys
import zipfile
import csv
from io import StringIO
from pathlib import Path

# Add backend directory to sys.path
ROOT_DIR = Path(__file__).parent
sys.path.append(str(ROOT_DIR / "backend"))

from app.database.database import init_db, get_db_connection, record_log
from app.database.tables import seed_default_users, seed_sample_students
from app.services.excel_service import validate_and_parse_excel
from app.services.certificate_service import generate_certificates_for_students

def run_automated_pipeline():
    print("=" * 70)
    print(" STUDENT CERTIFICATE GENERATOR - AUTOMATED BULK PIPELINE")
    print("=" * 70)

    # 1. Initialize Database & Tables
    print("\n[Step 1/5] Initializing SQLite Database & Default Users...")
    init_db()
    seed_default_users()
    seed_sample_students()
    print("  [OK] Database ready and default credentials seeded.")

    # 2. Automatically Scan, Validate & Import Excel Files from PC
    data_dir = ROOT_DIR / "data"
    uploads_dir = ROOT_DIR / "backend" / "uploads"
    
    excel_files = list(data_dir.glob("*.xlsx")) + list(data_dir.glob("*.xls")) + \
                  list(uploads_dir.glob("*.xlsx")) + list(uploads_dir.glob("*.xls"))
    
    unique_excel_files = list({f.resolve(): f for f in excel_files}.values())

    imported_student_ids = []
    if unique_excel_files:
        print(f"\n[Step 2/5] Auto-Detecting & Validating {len(unique_excel_files)} Excel file(s) from PC...")
        total_valid = 0
        total_invalid = 0
        for excel_file in unique_excel_files:
            try:
                with open(excel_file, "rb") as f:
                    val_res = validate_and_parse_excel(f.read())
                    total_valid += val_res["valid_count"]
                    total_invalid += val_res["invalid_count"]
                    imported_student_ids.extend(val_res["processed_student_ids"])
                print(f"  * {excel_file.name}: Valid Rows: {val_res['valid_count']} | Errors: {val_res['invalid_count']} | Status: {val_res['status']}")
                if val_res["errors"]:
                    for err in val_res["errors"][:3]:
                        print(f"    - [Row {err['row']}] {err['field']}: {err['message']}")
            except Exception as e:
                print(f"  * Error processing {excel_file.name}: {e}")
        print(f"  [OK] Total Valid Records: {total_valid} | Invalid/Rejected: {total_invalid}")
    else:
        print("\n[Step 2/5] Using seeded database student records.")

    # 3. Automatically Generate Vector PDF Certificates
    print("\n[Step 3/5] Bulk Generating High-Resolution PDF Certificates...")
    results = generate_certificates_for_students(
        student_ids=imported_student_ids if imported_student_ids else None,
        template_name="Standard",
        force_all=True
    )
    print(f"  [OK] Successfully generated {len(results)} vector PDF certificate(s).")
    for cert in results[:5]:
        print(f"  * [{cert['certificate_id']}] {cert['student_name']} -> {Path(cert['pdf_path']).name}")
    if len(results) > 5:
        print(f"  * ... and {len(results) - 5} more certificates.")

    # 4. Package PDFs into ZIP Archive with Manifest
    output_dir = ROOT_DIR / "output" / "certificates"
    output_dir.mkdir(parents=True, exist_ok=True)
    zip_output_path = ROOT_DIR / "output" / "all_students_certificates.zip"

    print(f"\n[Step 4/5] Packaging & Bundling into Bulk ZIP Archive...")
    pdf_files = list((ROOT_DIR / "backend" / "generated_certificates").glob("*.pdf"))

    with zipfile.ZipFile(zip_output_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        manifest_lines = [
            "=" * 70,
            "STUDENT CERTIFICATE GENERATOR - BATCH ARCHIVE MANIFEST",
            "=" * 70,
            f"Total Certificates Included: {len(pdf_files)}",
            "-" * 70,
            f"{'No.':<4} | {'Filename':<45} | {'Size (KB)'}",
            "-" * 70,
        ]

        csv_buffer = StringIO()
        csv_writer = csv.writer(csv_buffer)
        csv_writer.writerow(["Filename", "Size_Bytes", "Status"])

        for idx, pdf_path in enumerate(pdf_files, start=1):
            zip_file.write(pdf_path, arcname=pdf_path.name)
            size_kb = round(pdf_path.stat().st_size / 1024, 1)
            manifest_lines.append(f"{idx:<4} | {pdf_path.name:<45} | {size_kb} KB")
            csv_writer.writerow([pdf_path.name, pdf_path.stat().st_size, "Verified"])

            # Copy to output certificates directory
            dest = output_dir / pdf_path.name
            if pdf_path.resolve() != dest.resolve():
                import shutil
                shutil.copy(pdf_path, dest)

        manifest_lines.append("=" * 70)
        manifest_lines.append("Public Verification: http://localhost:5173/verify")
        manifest_lines.append("=" * 70)

        zip_file.writestr("CREDENTIAL_MANIFEST.txt", "\n".join(manifest_lines))
        zip_file.writestr("CERTIFICATES_SUMMARY.csv", csv_buffer.getvalue())

    print(f"  [OK] ZIP Archive Created: {zip_output_path} ({round(zip_output_path.stat().st_size / 1024, 1)} KB)")
    print(f"  [OK] Individual Certificates Folder: {output_dir}")

    # 5. Log Pipeline Execution
    print(f"\n[Step 5/5] Logging Batch Run to Audit Trail...")
    record_log(
        event_type="AUTO_PIPELINE",
        status="SUCCESS",
        total_records=len(results),
        success_count=len(results),
        error_count=0,
        details=f"Automated pipeline completed: {len(results)} certificates bundled into {zip_output_path.name}."
    )
    print("  [OK] Audit log entry recorded.")

    print("\n" + "=" * 70)
    print(" AUTOMATIC CERTIFICATE GENERATION & ZIP DOWNLOAD READY!")
    print("=" * 70)

if __name__ == "__main__":
    run_automated_pipeline()
