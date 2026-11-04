import os
import hashlib
from pathlib import Path
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, String, Group, Circle, Line
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).parent.parent.parent
GENERATED_DIR = BASE_DIR / "generated_certificates"
ASSETS_DIR = BASE_DIR.parent / "assets"

# Template Themes Configuration
TEMPLATE_CONFIGS = {
    "Standard": {
        "name": "Standard (Executive Gold)",
        "primary_color": "#0F172A",     # Deep Navy
        "accent_color": "#D4AF37",      # 24K Gold
        "border_color": "#D4AF37",
        "sub_border_color": "#0F172A",
        "title_color": "#0F172A",
        "recipient_color": "#1E3A8A",
        "course_color": "#0284C7",
        "badge_title": "★ OFFICIAL SEAL ★",
        "badge_sub": "Tamper-Proof Credential",
        "badge_color": "#D4AF37",
        "default_institution": "NATIONAL ACADEMY OF TECHNOLOGY",
        "default_title": "CERTIFICATE OF EXCELLENCE",
        "default_signatory": "Dr. Aris Thorne",
        "default_signatory_role": "Director of Academics",
    },
    "Modern Tech": {
        "name": "Modern Tech (Cyber Cyan)",
        "primary_color": "#0B1329",     # Slate Obsidian
        "accent_color": "#06B6D4",      # Cyan
        "border_color": "#06B6D4",
        "sub_border_color": "#3B82F6",
        "title_color": "#0F172A",
        "recipient_color": "#0369A1",
        "course_color": "#0891B2",
        "badge_title": "⚡ TECH ACCREDITED ⚡",
        "badge_sub": "Verified Cloud Credential",
        "badge_color": "#06B6D4",
        "default_institution": "INSTITUTE OF ADVANCED TECHNOLOGIES",
        "default_title": "CERTIFICATE OF TECHNICAL PROFICIENCY",
        "default_signatory": "Prof. Elena Vance",
        "default_signatory_role": "Chief Technology Architect",
    },
    "Academic Burgundy": {
        "name": "Academic Prestige (Crimson Burgundy)",
        "primary_color": "#450A0A",     # Burgundy
        "accent_color": "#B45309",      # Bronze Gold
        "border_color": "#991B1B",
        "sub_border_color": "#B45309",
        "title_color": "#450A0A",
        "recipient_color": "#7F1D1D",
        "course_color": "#B45309",
        "badge_title": "★ SIGILLUM ACADEMIAE ★",
        "badge_sub": "Excellentia & Veritas",
        "badge_color": "#991B1B",
        "default_institution": "ROYAL UNIVERSITY OF SCIENCES & ARTS",
        "default_title": "HONORIS CERTIFICATUM EXCELLENTIA",
        "default_signatory": "Sir Arthur Pendelton",
        "default_signatory_role": "Chancellor & Provost",
    },
    "Minimalist Platinum": {
        "name": "Minimalist Platinum (Corporate Emerald)",
        "primary_color": "#064E3B",     # Forest Emerald
        "accent_color": "#059669",      # Emerald Green
        "border_color": "#059669",
        "sub_border_color": "#94A3B8",
        "title_color": "#064E3B",
        "recipient_color": "#047857",
        "course_color": "#059669",
        "badge_title": "◆ VERIFIED MERIT ◆",
        "badge_sub": "Global Standard Board",
        "badge_color": "#059669",
        "default_institution": "GLOBAL PROFESSIONAL CERTIFICATION BOARD",
        "default_title": "CERTIFICATE OF PROFESSIONAL MASTERY",
        "default_signatory": "Marcus Vance, MBA",
        "default_signatory_role": "Managing Director",
    }
}

class ThemedCertificateCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self.template_key = kwargs.pop("template_key", "Standard")
        super().__init__(*args, **kwargs)
        self.pages = []

    def showPage(self):
        self.pages.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        for page in self.pages:
            self.__dict__.update(page)
            self.draw_certificate_decorations()
            super().showPage()
        super().save()

    def draw_certificate_decorations(self):
        width, height = 792, 612
        cfg = TEMPLATE_CONFIGS.get(self.template_key, TEMPLATE_CONFIGS["Standard"])

        primary_hex = cfg["border_color"]
        secondary_hex = cfg["sub_border_color"]

        # Outer Primary Border
        self.setStrokeColor(colors.HexColor(primary_hex))
        self.setLineWidth(5)
        self.rect(20, 20, width - 40, height - 40)

        # Inner Decorative Border
        self.setStrokeColor(colors.HexColor(secondary_hex))
        self.setLineWidth(1.5)
        self.rect(28, 28, width - 56, height - 56)

        # Style-specific Corner Accents
        corner_size = 14
        self.setFillColor(colors.HexColor(primary_hex))
        
        # 4 Corner Accents
        self.rect(20, height - 34, corner_size, corner_size, fill=1)
        self.rect(width - 34, height - 34, corner_size, corner_size, fill=1)
        self.rect(20, 20, corner_size, corner_size, fill=1)
        self.rect(width - 34, 20, corner_size, corner_size, fill=1)

        # Secondary inner corner diamonds
        self.setFillColor(colors.HexColor(secondary_hex))
        dia_offset = 32
        dia_size = 6
        self.rect(dia_offset, height - dia_offset - dia_size, dia_size, dia_size, fill=1)
        self.rect(width - dia_offset - dia_size, height - dia_offset - dia_size, dia_size, dia_size, fill=1)
        self.rect(dia_offset, dia_offset, dia_size, dia_size, fill=1)
        self.rect(width - dia_offset - dia_size, dia_offset, dia_size, dia_size, fill=1)


def generate_pdf_certificate(
    cert_id: str,
    student_name: str,
    course_name: str,
    grade: str,
    issue_date: str,
    template_name: str = "Standard",
    institution_name: str = None,
    cert_title: str = None,
    signatory_name: str = None,
    signatory_title: str = None
) -> str:
    """
    Renders high-resolution vector PDF certificate with custom templates,
    embedded dynamic QR code, and SHA-256 tamper-proof fingerprint.
    """
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    clean_name = "".join(c for c in student_name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    pdf_filename = f"{cert_id}_{clean_name}.pdf"
    pdf_path = GENERATED_DIR / pdf_filename

    # Resolve template configuration
    matched_key = "Standard"
    for k in TEMPLATE_CONFIGS.keys():
        if k.lower() in template_name.lower():
            matched_key = k
            break
    cfg = TEMPLATE_CONFIGS[matched_key]

    inst_name = institution_name or cfg["default_institution"]
    title_text = cert_title or cfg["default_title"]
    sig_name = signatory_name or cfg["default_signatory"]
    sig_role = signatory_title or cfg["default_signatory_role"]

    # 792 x 612 Landscape Letter Page
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=landscape(letter),
        leftMargin=45,
        rightMargin=45,
        topMargin=42,
        bottomMargin=42
    )

    styles = getSampleStyleSheet()

    # Dynamic Typography based on Template
    inst_style = ParagraphStyle(
        'CertInst',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor(cfg["primary_color"]),
        alignment=1
    )

    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=27,
        leading=32,
        textColor=colors.HexColor(cfg["title_color"]),
        alignment=1
    )

    subtitle_style = ParagraphStyle(
        'CertSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#64748B"),
        alignment=1
    )

    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=35,
        textColor=colors.HexColor(cfg["recipient_color"]),
        alignment=1
    )

    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#334155"),
        alignment=1
    )

    course_style = ParagraphStyle(
        'CertCourse',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=26,
        textColor=colors.HexColor(cfg["course_color"]),
        alignment=1
    )

    id_style = ParagraphStyle(
        'CertId',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#94A3B8"),
        alignment=2
    )

    elements = []

    # 1. Top Metadata Row: Verification Code & Template Style
    top_meta_table = Table([[
        Paragraph(f"<font color='#64748B'>Design Style: <b>{cfg['name']}</b></font>", subtitle_style),
        Paragraph(f"Verification Code: <b>{cert_id}</b>", id_style)
    ]], colWidths=[350, 350])
    top_meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    elements.append(top_meta_table)
    elements.append(Spacer(1, 12))

    # 2. Institution Name & Emblem
    elements.append(Paragraph(inst_name.upper(), inst_style))
    elements.append(Spacer(1, 8))

    # 3. Main Headline
    elements.append(Paragraph(title_text.upper(), title_style))
    elements.append(Spacer(1, 10))

    # 4. Award Statement
    elements.append(Paragraph("THIS CREDENTIAL IS PROUDLY CONFERRED UPON", subtitle_style))
    elements.append(Spacer(1, 14))

    # 5. Candidate Name
    elements.append(Paragraph(student_name, name_style))
    elements.append(Spacer(1, 14))

    # 6. Description Text
    elements.append(Paragraph("for successfully completing with academic excellence the specialization in", body_style))
    elements.append(Spacer(1, 8))

    # 7. Course Program
    elements.append(Paragraph(course_name, course_style))
    elements.append(Spacer(1, 8))

    # 8. Performance Grade
    elements.append(Paragraph(f"with an Evaluation Performance Grade of <b>{grade}</b>", body_style))
    elements.append(Spacer(1, 16))

    # 9. Cryptographic Fingerprint & Dynamic QR Code
    raw_payload = f"{cert_id}:{student_name}:{course_name}:{grade}:{issue_date}"
    fingerprint = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    verify_url = f"http://localhost:5173/verify/{cert_id}"
    qr = QrCodeWidget(verify_url)
    bounds = qr.getBounds()
    w = bounds[2] - bounds[0]
    h = bounds[3] - bounds[1]
    qr_size = 46
    qr_drawing = Drawing(qr_size, qr_size, transform=[qr_size/w, 0, 0, qr_size/h, 0, 0])
    qr_drawing.add(qr)

    # 10. Footer Table (Issue Date | Seal Badge | QR Code | Signatory)
    date_text = Paragraph(f"<b>Date of Issue</b><br/>{issue_date}", subtitle_style)
    
    badge_html = f"<font color='{cfg['badge_color']}' size='12'><b>{cfg['badge_title']}</b></font><br/><font size='7' color='#64748B'>{cfg['badge_sub']}</font>"
    seal_text = Paragraph(badge_html, subtitle_style)

    qr_label = Paragraph(f"<font size='7' color='#475569'>Scan to Verify<br/><b>{cert_id}</b></font>", subtitle_style)
    qr_table = Table([[qr_drawing], [qr_label]], colWidths=[110])
    qr_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('TOPPADDING', (0,0), (-1,-1), 1),
    ]))

    sig_text = Paragraph(f"<b>{sig_role}</b><br/>{sig_name}", subtitle_style)

    footer_table = Table([[date_text, seal_text, qr_table, sig_text]], colWidths=[175, 185, 120, 190])
    footer_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEABOVE', (0,0), (0,0), 1, colors.HexColor("#CBD5E1")),
        ('LINEABOVE', (3,0), (3,0), 1, colors.HexColor("#CBD5E1")),
    ]))

    elements.append(footer_table)
    elements.append(Spacer(1, 6))

    # 11. Security Fingerprint Note
    elements.append(Paragraph(
        f"<font size='7' color='#94A3B8'>SHA-256 Tamper-Proof Fingerprint: {fingerprint} &nbsp;|&nbsp; Public Verification: {verify_url}</font>",
        subtitle_style
    ))

    # Canvas closure with template key
    def make_canvas(*c_args, **c_kwargs):
        c_kwargs["template_key"] = matched_key
        return ThemedCertificateCanvas(*c_args, **c_kwargs)

    doc.build(elements, canvasmaker=make_canvas)
    return str(pdf_path)
