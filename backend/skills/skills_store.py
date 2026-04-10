import chromadb
import uuid
from config import settings

client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
collection = client.get_or_create_collection("agent_skills")


def save_skill(skill: str, doc_type: str, industry: str, source: str = "auto"):
    collection.add(
        ids=[str(uuid.uuid4())],
        documents=[skill],
        metadatas=[{"skill": skill, "doc_type": doc_type, "industry": industry, "source": source}],
    )


def get_skills(doc_type: str = "", industry: str = "", n: int = 5) -> list:
    try:
        query = f"{doc_type} {industry}".strip() or "document"
        results = collection.query(query_texts=[query], n_results=n)
        return results["metadatas"][0] if results["metadatas"] else []
    except Exception:
        return []


def list_all_skills() -> list:
    result = collection.get()
    return result["metadatas"] if result["metadatas"] else []


def delete_skill(skill_id: str):
    collection.delete(ids=[skill_id])
