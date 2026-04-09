import chromadb
from config import settings
from typing import Optional

client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
collection = client.get_or_create_collection("brand_profiles")


def save_brand(brand_id: str, brand: dict):
    collection.upsert(
        ids=[brand_id],
        documents=[str(brand)],
        metadatas=[brand],
    )


def get_brand(brand_id: str) -> Optional[dict]:
    result = collection.get(ids=[brand_id])
    if result and result["metadatas"]:
        return result["metadatas"][0]
    return None


def list_brands() -> list:
    result = collection.get()
    return result["metadatas"] if result["metadatas"] else []
