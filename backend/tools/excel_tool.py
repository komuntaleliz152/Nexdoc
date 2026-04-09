import os
from xlsxwriter import Workbook
from config import settings


def generate_excel(title: str, content: str, brand: dict, filename: str) -> str:
    os.makedirs(settings.output_dir, exist_ok=True)
    path = os.path.join(settings.output_dir, filename)

    hex_color = brand.get("primary_color", "#000000").lstrip("#").upper()
    font_name = brand.get("font", "Calibri")

    workbook = Workbook(path)
    worksheet = workbook.add_worksheet("Document")

    # Title format — brand color text + bottom border + background tint
    title_fmt = workbook.add_format({
        "bold": True,
        "font_size": 18,
        "font_color": f"#{hex_color}",
        "font_name": font_name,
        "bottom": 2,
        "bottom_color": f"#{hex_color}",
        "bg_color": f"#{hex_color}1A",  # 10% opacity tint
        "valign": "vcenter",
    })

    # Section header format
    section_fmt = workbook.add_format({
        "bold": True,
        "font_size": 12,
        "font_color": f"#{hex_color}",
        "font_name": font_name,
        "top": 1,
        "top_color": f"#{hex_color}",
    })

    # Body format
    body_fmt = workbook.add_format({
        "font_size": 11,
        "font_name": font_name,
        "text_wrap": True,
        "valign": "top",
    })

    worksheet.set_column("A:A", 110)
    worksheet.set_row(0, 36)
    worksheet.write("A1", title, title_fmt)

    row = 2
    for para in content.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if para.startswith("#"):
            worksheet.set_row(row, 24)
            worksheet.write(row, 0, para.lstrip("#").strip(), section_fmt)
        else:
            lines = para.count("\n") + 1
            worksheet.set_row(row, max(40, lines * 18))
            worksheet.write(row, 0, para, body_fmt)
        row += 1

    workbook.close()
    return path
