from tinydb import TinyDB, Query
from config import settings
import os

os.makedirs(settings.chroma_persist_dir, exist_ok=True)
db = TinyDB(os.path.join(settings.chroma_persist_dir, "brands.json"))


def save_brand(brand_id: str, brand: dict):
    Brand = Query()
    db.upsert(brand, Brand.id == brand_id)


def get_brand(brand_id: str) -> dict | None:
    Brand = Query()
    result = db.search(Brand.id == brand_id)
    return result[0] if result else None


def list_brands() -> list:
    return db.all()
