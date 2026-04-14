from tinydb import TinyDB, Query
from config import settings
import os
import uuid

os.makedirs(settings.chroma_persist_dir, exist_ok=True)
db = TinyDB(os.path.join(settings.chroma_persist_dir, "skills.json"))


def save_skill(skill: str, doc_type: str, industry: str, source: str = "auto"):
    db.insert({"id": str(uuid.uuid4()), "skill": skill, "doc_type": doc_type,
               "industry": industry, "source": source})


def get_skills(doc_type: str = "", industry: str = "", n: int = 5) -> list:
    items = db.all()
    # Filter by doc_type or industry if provided
    filtered = [i for i in items if
                (not doc_type or i.get("doc_type") in (doc_type, "general")) and
                (not industry or i.get("industry") in (industry, "general"))]
    return filtered[:n]


def list_all_skills() -> list:
    return db.all()


def delete_skill(skill_id: str):
    db.remove(Query().id == skill_id)
