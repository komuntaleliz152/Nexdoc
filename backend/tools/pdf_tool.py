import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from config import settings


def generate_pdf(title: str, content: str, brand: dict, filename: str) -> str:
    os.makedirs(settings.output_dir, exist_ok=True)
    path = os.path.join(settings.output_dir, filename)

    primary_color = _hex_to_color(brand.get("primary_color", "#000000"))
    font = brand.get("font", "Helvetica")

    doc = SimpleDocTemplate(path, pagesize=A4,
                            leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "BrandTitle",
        parent=styles["Title"],
        textColor=primary_color,
        fontSize=24,
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        "BrandBody",
        parent=styles["Normal"],
        fontSize=11,
        leading=16,
    )

    story = [Paragraph(title, title_style), Spacer(1, 6*mm)]
    for para in content.split("\n\n"):
        story.append(Paragraph(para.strip(), body_style))
        story.append(Spacer(1, 4*mm))

    doc.build(story)
    return path


def _hex_to_color(hex_color: str):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    return colors.Color(r, g, b)
