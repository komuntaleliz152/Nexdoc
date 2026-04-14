from tinydb import TinyDB, Query
from config import settings
import os
import json
from datetime import datetime

os.makedirs(settings.chroma_persist_dir, exist_ok=True)
db = TinyDB(os.path.join(settings.chroma_persist_dir, "history.json"))


def save_document(doc_id: str, topic: str, doc_type: str, output_format: str,
                  brand_id: str, filename: str, raw_content: dict | list):
    db.upsert({
        "doc_id": doc_id, "topic": topic, "doc_type": doc_type,
        "output_format": output_format, "brand_id": brand_id,
        "filename": filename, "created_at": datetime.utcnow().isoformat(),
        "raw_content": json.dumps(raw_content),
    }, Query().doc_id == doc_id)


def get_history(limit: int = 20) -> list:
    items = db.all()
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:limit]


def delete_document(doc_id: str):
    db.remove(Query().doc_id == doc_id)
