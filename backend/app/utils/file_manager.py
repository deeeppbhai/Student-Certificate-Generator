import os
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
GENERATED_DIR = BASE_DIR / "generated_certificates"
ROOT_OUTPUT_DIR = BASE_DIR.parent / "output" / "certificates"

def ensure_directories():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    ROOT_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def save_uploaded_file(file_bytes: bytes, filename: str) -> str:
    ensure_directories()
    file_path = UPLOAD_DIR / filename
    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return str(file_path)

def copy_to_root_output(src_pdf_path: str, filename: str):
    ensure_directories()
    dest = ROOT_OUTPUT_DIR / filename
    try:
        shutil.copy(src_pdf_path, dest)
    except Exception as e:
        print(f"Error copying to root output: {e}")

def clean_all_certificates():
    """Removes all generated PDF certificates and zip archives from disk"""
    ensure_directories()
    for f in GENERATED_DIR.glob("*.pdf"):
        try:
            f.unlink()
        except Exception:
            pass
    for f in ROOT_OUTPUT_DIR.glob("*.pdf"):
        try:
            f.unlink()
        except Exception:
            pass
    for p in [BASE_DIR.parent / "output" / "all_students_certificates.zip", BASE_DIR.parent / "all_students_certificates.zip"]:
        if p.exists():
            try:
                p.unlink()
            except Exception:
                pass
