class Certificate:
    def __init__(self, id, certificate_id, student_id, student_name, course_name, grade, issue_date, pdf_path, template_name='Standard', created_at=None):
        self.id = id
        self.certificate_id = certificate_id
        self.student_id = student_id
        self.student_name = student_name
        self.course_name = course_name
        self.grade = grade
        self.issue_date = issue_date
        self.pdf_path = pdf_path
        self.template_name = template_name
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "certificate_id": self.certificate_id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "course_name": self.course_name,
            "grade": self.grade,
            "issue_date": self.issue_date,
            "pdf_path": self.pdf_path,
            "template_name": self.template_name,
            "created_at": self.created_at
        }
