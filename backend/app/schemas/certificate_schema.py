from pydantic import BaseModel
from typing import Optional, List

class CertificateGenerateRequest(BaseModel):
    student_ids: Optional[List[int]] = None
    template_name: Optional[str] = "Standard"
    institution_name: Optional[str] = None
    cert_title: Optional[str] = None
    signatory_name: Optional[str] = None
    signatory_title: Optional[str] = None

class CertificateResponse(BaseModel):
    id: int
    certificate_id: str
    student_id: int
    student_name: str
    course_name: str
    grade: str
    issue_date: str
    pdf_path: str
    template_name: str
