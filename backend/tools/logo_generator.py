import os
from PIL import Image, ImageDraw, ImageFont
from config import settings


def generate_logo(brand: dict) -> str:
    """Generate a PNG logo from brand profile using Pillow. Returns PNG file path."""
    os.makedirs(settings.output_dir, exist_ok=True)

    name = brand.get("name", "Brand")
    color = _hex_to_rgb(brand.get("primary_color", "#000000"))
    initials = "".join(w[0].upper() for w in name.split()[:2])
    tagline = brand.get("tagline", "")

    W, H = 640, 200
    img = Image.new("RGBA", (W, H), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # Badge background (rounded rect via ellipse + rectangle)
    badge_x, badge_y, badge_w, badge_h = 0, 20, 180, 160
    r = 20
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
                            radius=r, fill=color)

    # Initials text in badge
    text_color = _contrast_color(brand.get("primary_color", "#000000"))
    try:
        font_big = ImageFont.truetype("arial.ttf", 64)
        font_name = ImageFont.truetype("arialbd.ttf", 40)
        font_tag = ImageFont.truetype("arial.ttf", 22)
    except Exception:
        font_big = ImageFont.load_default()
        font_name = font_big
        font_tag = font_big

    # Center initials in badge
    bbox = draw.textbbox((0, 0), initials, font=font_big)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((badge_x + (badge_w - tw) // 2, badge_y + (badge_h - th) // 2 - 4),
              initials, font=font_big, fill=text_color)

    # Brand name
    draw.text((badge_w + 20, 40), name, font=font_name, fill=color)

    # Accent line
    line_y = 105
    draw.line([(badge_w + 20, line_y), (W - 20, line_y)], fill=(*color, 80), width=2)

    # Tagline
    if tagline:
        draw.text((badge_w + 20, line_y + 10), tagline, font=font_tag, fill=(100, 100, 100))

    brand_id = brand.get("id", "brand")
    path = os.path.join(settings.output_dir, f"logo_{brand_id}.png")
    # Save with white background
    bg = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    bg.convert("RGB").save(path, "PNG")
    return path


def _hex_to_rgb(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _contrast_color(hex_color: str) -> tuple:
    hex_color = hex_color.lstrip("#")
    r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return (255, 255, 255) if luminance < 0.5 else (0, 0, 0)
