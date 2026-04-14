from tinydb import TinyDB, Query
from config import settings
import os
import uuid

os.makedirs(settings.chroma_persist_dir, exist_ok=True)
db = TinyDB(os.path.join(settings.chroma_persist_dir, "feedback.json"))


def store_feedback(prompt: str, output: str, rating: int, notes: str = ""):
    db.insert({"id": str(uuid.uuid4()), "prompt": prompt, "output": output, "rating": rating, "notes": notes})


def get_top_examples(prompt: str, n: int = 3) -> list:
    Feedback = Query()
    results = db.search(Feedback.rating >= 4)
    results.sort(key=lambda x: x.get("rating", 0), reverse=True)
    return [r["prompt"] + "\n" + r["output"] for r in results[:n]]
