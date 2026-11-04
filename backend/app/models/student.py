class Student:
    def __init__(self, id, student_id, name, email, course, grade, issue_date, status='Pending', certificate_id=None, created_at=None):
        self.id = id
        self.student_id = student_id
        self.name = name
        self.email = email
        self.course = course
        self.grade = grade
        self.issue_date = issue_date
        self.status = status
        self.certificate_id = certificate_id
        self.created_at = created_at

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "name": self.name,
            "email": self.email,
            "course": self.course,
            "grade": self.grade,
            "issue_date": self.issue_date,
            "status": self.status,
            "certificate_id": self.certificate_id,
            "created_at": self.created_at
        }
