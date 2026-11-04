import zipfile
import csv
from io import BytesIO, StringIO
from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from fastapi.responses import FileResponse, StreamingResponse
from app.database.database import get_db_connection

router = APIRouter(prefix="/api/download", tags=["Download"])

BASE_DIR = Path(__file__).parent.parent.parent
GENERATED_DIR = BASE_DIR / "generated_certificates"
ROOT_OUTPUT_DIR = BASE_DIR.parent / "output" / "certificates"

class SelectedDownloadRequest(BaseModel):
    certificate_ids: List[str]

def _build_zip_archive(pdf_files: list) -> BytesIO:
    """Builds a ZIP archive from PDF file list, embedding manifest and CSV summary."""
    zip_io = BytesIO()
    with zipfile.ZipFile(zip_io, "w", zipfile.ZIP_DEFLATED) as zip_file:
        manifest_lines = [
            "=" * 70,
            "STUDENT CERTIFICATE GENERATOR - OFFICIAL CREDENTIAL BUNDLE",
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
            if pdf_path.exists():
                size_kb = round(pdf_path.stat().st_size / 1024, 1)
                zip_file.write(pdf_path, arcname=pdf_path.name)
                manifest_lines.append(f"{idx:<4} | {pdf_path.name:<45} | {size_kb} KB")
                csv_writer.writerow([pdf_path.name, pdf_path.stat().st_size, "Verified"])

        manifest_lines.append("=" * 70)
        manifest_lines.append("Public Verification Portal: http://localhost:5173/verify")
        manifest_lines.append("=" * 70)

        zip_file.writestr("CREDENTIAL_MANIFEST.txt", "\n".join(manifest_lines))
        zip_file.writestr("CERTIFICATES_SUMMARY.csv", csv_buffer.getvalue())

    zip_io.seek(0)
    return zip_io

# Static routes MUST be declared before /{cert_id} parameter
@router.get("/all-zip")
def download_all_certificates_zip():
    """Download all issued certificates in a compressed ZIP archive with manifest"""
    pdf_files = list(GENERATED_DIR.glob("*.pdf"))
    if not pdf_files:
        pdf_files = list(ROOT_OUTPUT_DIR.glob("*.pdf"))
        
    if not pdf_files:
        raise HTTPException(status_code=404, detail="No generated certificate PDF files found to bundle.")

    # Deduplicate by file name
    unique_pdfs = list({f.name: f for f in pdf_files}.values())
    zip_io = _build_zip_archive(unique_pdfs)

    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=all_student_certificates.zip"}
    )

# Backward compatibility alias
@router.get("-all-zip")
def download_all_certificates_zip_legacy():
    return download_all_certificates_zip()

@router.post("/selected-zip")
def download_selected_certificates_zip(req: SelectedDownloadRequest):
    """Download specific selected certificates as a custom ZIP bundle"""
    if not req.certificate_ids:
        raise HTTPException(status_code=400, detail="No certificate IDs specified.")

    selected_files = []
    for cert_id in req.certificate_ids:
        clean_id = cert_id.strip()
        matches = list(GENERATED_DIR.glob(f"*{clean_id}*.pdf")) + list(ROOT_OUTPUT_DIR.glob(f"*{clean_id}*.pdf"))
        if matches:
            selected_files.append(matches[0])

    if not selected_files:
        raise HTTPException(status_code=404, detail="None of the requested certificates were found on disk.")

    unique_files = list({f.name: f for f in selected_files}.values())
    zip_io = _build_zip_archive(unique_files)

    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=selected_certificates_{len(unique_files)}.zip"}
    )

@router.get("/batch-zip")
def download_batch_zip(cert_ids: str = Query(..., description="Comma-separated certificate IDs")):
    """Download only the certificates generated in the uploaded Excel batch"""
    id_list = [c.strip() for c in cert_ids.split(",") if c.strip()]
    if not id_list:
        raise HTTPException(status_code=400, detail="No certificate IDs provided.")

    selected_files = []
    for cert_id in id_list:
        clean_id = cert_id.strip()
        matches = list(GENERATED_DIR.glob(f"*{clean_id}*.pdf")) + list(ROOT_OUTPUT_DIR.glob(f"*{clean_id}*.pdf"))
        if matches:
            selected_files.append(matches[0])

    if not selected_files:
        raise HTTPException(status_code=404, detail="No certificate PDF files found on disk for this batch.")

    unique_files = list({f.name: f for f in selected_files}.values())
    zip_io = _build_zip_archive(unique_files)

    return StreamingResponse(
        zip_io,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=uploaded_batch_certificates_{len(unique_files)}.zip"}
    )

@router.get("/{cert_id}")
def download_single_certificate(cert_id: str, disposition: str = Query("attachment")):
    """Download or view an individual vector PDF certificate by ID"""
    clean_id = cert_id.strip()
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM certificates WHERE UPPER(certificate_id) = UPPER(?)", (clean_id,))
    cert = cursor.fetchone()
    conn.close()

    file_path = None
    if cert and cert["pdf_path"]:
        p = Path(cert["pdf_path"])
        if p.exists():
            file_path = p

    if not file_path:
        # Search generated directory and root output
        matching = list(GENERATED_DIR.glob(f"*{clean_id}*.pdf")) + list(ROOT_OUTPUT_DIR.glob(f"*{clean_id}*.pdf"))
        if matching:
            file_path = matching[0]

    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Certificate PDF file for '{clean_id}' not found on disk.")

    media_type = "application/pdf"
    content_disp = "inline" if disposition == "inline" else f"attachment; filename={file_path.name}"

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type=media_type,
        headers={"Content-Disposition": content_disp}
    )
