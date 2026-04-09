import chromadb
from config import settings
import uuid

client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
collection = client.get_or_create_collection("document_feedback")


def store_feedback(prompt: str, output: str, rating: int, notes: str = ""):
    """Store a document generation result with user rating for self-improvement."""
    collection.add(
        ids=[str(uuid.uuid4())],
        documents=[f"PROMPT: {prompt}\nOUTPUT: {output}"],
        metadatas=[{"rating": rating, "notes": notes, "prompt": prompt}],
    )


def get_top_examples(prompt: str, n: int = 3) -> list:
    """Retrieve highest-rated past examples similar to the current prompt."""
    results = collection.query(
        query_texts=[prompt],
        n_results=n,
        where={"rating": {"$gte": 4}},
    )
    return results["documents"][0] if results["documents"] else []
