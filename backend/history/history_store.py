import chromadb
import uuid
import json
from datetime import datetime
from config import settings

client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
collection = client.get_or_create_collection("document_history")


def save_document(doc_id: str, topic: str, doc_type: str, output_format: str,
                  brand_id: str, filename: str, raw_content: dict | list):
    collection.upsert(
        ids=[doc_id],
        documents=[topic],
        metadatas=[{
            "doc_id": doc_id,
            "topic": topic,
            "doc_type": doc_type,
            "output_format": output_format,
            "brand_id": brand_id,
            "filename": filename,
            "created_at": datetime.utcnow().isoformat(),
            "raw_content": json.dumps(raw_content),
        }],
    )


def get_history(limit: int = 20) -> list:
    result = collection.get()
    if not result["metadatas"]:
        return []
    items = result["metadatas"]
    # Sort by created_at descending
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:limit]


def delete_document(doc_id: str):
    collection.delete(ids=[doc_id])
