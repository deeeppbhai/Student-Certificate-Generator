from pydantic import BaseModel
from typing import Optional

class StudentCreate(BaseModel):
    student_id: str
    name: str
    email: str
    course: str
    grade: str
    issue_date: str

class StudentResponse(BaseModel):
    id: int
    student_id: str
    name: str
    email: str
    course: str
    grade: str
    issue_date: str
    status: str
    certificate_id: Optional[str] = None
