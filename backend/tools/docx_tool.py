import os
from docx import Document
from docx.shared import Pt, RGBColor
from config import settings


def generate_docx(title: str, content: str, brand: dict, filename: str) -> str:
    os.makedirs(settings.output_dir, exist_ok=True)
    doc = Document()

    # Apply brand font and color
    primary_color = _hex_to_rgb(brand.get("primary_color", "#000000"))

    # Title
    heading = doc.add_heading(title, level=1)
    run = heading.runs[0]
    run.font.color.rgb = RGBColor(*primary_color)
    run.font.name = brand.get("font", "Calibri")

    # Body
    for para in content.split("\n\n"):
        p = doc.add_paragraph(para.strip())
        for run in p.runs:
            run.font.name = brand.get("font", "Calibri")
            run.font.size = Pt(11)

    path = os.path.join(settings.output_dir, filename)
    doc.save(path)
    return path


def _hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
