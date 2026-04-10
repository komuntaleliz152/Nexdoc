import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from config import settings
from tools.logo_generator import generate_logo


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
        "BrandTitle", parent=styles["Title"],
        textColor=primary_color, fontSize=24, spaceAfter=12,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "BrandBody", parent=styles["Normal"],
        fontSize=11, leading=16, textColor=colors.HexColor("#111111"),
        fontName="Helvetica",
    )
    subheading_style = ParagraphStyle(
        "BrandSubheading", parent=styles["Normal"],
        fontSize=13, leading=18, fontName="Helvetica-Bold",
        textColor=primary_color, spaceBefore=10, spaceAfter=4,
    )

    story = []

    # Logo
    try:
        logo_path = generate_logo(brand)
        story.append(Image(logo_path, width=160, height=50))
        story.append(Spacer(1, 4*mm))
    except Exception:
        pass

    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 6*mm))
    for para in content.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        # Detect subheadings: short single lines without punctuation
        lines = para.split("\n")
        if len(lines) == 1 and len(para) < 60 and not para.endswith("."):
            story.append(Paragraph(para, subheading_style))
        else:
            story.append(Paragraph(para, body_style))
            story.append(Spacer(1, 4*mm))

    doc.build(story)
    return path


def _hex_to_color(hex_color: str):
    hex_color = hex_color.lstrip("#")
    if len(hex_color) != 6:
        hex_color = "000000"
    r, g, b = (int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    return colors.Color(r, g, b, alpha=1)
