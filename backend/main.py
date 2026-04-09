import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional

from agents.document_agent import create_document, review_document, update_document
from brand.brand_manager import save_brand, get_brand, list_brands
from feedback.feedback_store import store_feedback

app = FastAPI(title="Brand-Aware Document Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Brand endpoints ---

class BrandProfile(BaseModel):
    id: str
    name: str
    tone: str = "professional"
    industry: str = "general"
    tagline: str = ""
    primary_color: str = "#000000"
    font: str = "Calibri"


@app.post("/brands")
def create_brand(brand: BrandProfile):
    save_brand(brand.id, brand.model_dump())
    return {"message": "Brand saved", "brand_id": brand.id}


@app.get("/brands")
def get_brands():
    return list_brands()


@app.get("/brands/{brand_id}")
def fetch_brand(brand_id: str):
    brand = get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand


# --- Document generation endpoint ---

class GenerateRequest(BaseModel):
    topic: str
    doc_type: Literal["report", "proposal", "presentation", "brief"]
    output_format: Literal["docx", "pptx", "pdf", "excel"]
    brand_id: str


@app.post("/generate")
def generate(req: GenerateRequest):
    brand = get_brand(req.brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    try:
        result = create_document(
            topic=req.topic,
            doc_type=req.doc_type,
            output_format=req.output_format,
            brand=brand,
        )
        return {
            "message": "Document generated",
            "doc_id": result["doc_id"],
            "output_path": result["output_path"],
            "raw_content": result["raw_content"],
            "download_url": f"/download/{os.path.basename(result['output_path'])}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download/{filename}")
def download(filename: str):
    from config import settings
    path = os.path.join(settings.output_dir, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename)


# --- Feedback endpoint ---

class FeedbackRequest(BaseModel):
    prompt: str
    output: str
    rating: int  # 1-5
    notes: Optional[str] = ""


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    store_feedback(req.prompt, req.output, req.rating, req.notes)
    return {"message": "Feedback stored"}

# --- Review endpoint ---

class ReviewRequest(BaseModel):
    raw_content: dict | list
    doc_type: Literal["report", "proposal", "presentation", "brief"]
    brand_id: str


@app.post("/review")
def review(req: ReviewRequest):
    brand = get_brand(req.brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    result = review_document(req.raw_content, req.doc_type, brand)
    return result


# --- Update endpoint ---

class UpdateRequest(BaseModel):
    raw_content: dict | list
    doc_type: Literal["report", "proposal", "presentation", "brief"]
    output_format: Literal["docx", "pptx", "pdf"]
    topic: str
    brand_id: str
    feedback: str
    doc_id: str


@app.post("/update")
def update(req: UpdateRequest):
    brand = get_brand(req.brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    result = update_document(
        raw_content=req.raw_content,
        doc_type=req.doc_type,
        output_format=req.output_format,
        topic=req.topic,
        brand=brand,
        feedback=req.feedback,
        doc_id=req.doc_id,
    )
    return {
        "message": "Document updated",
        "doc_id": result["doc_id"],
        "output_path": result["output_path"],
        "raw_content": result["raw_content"],
        "download_url": f"/download/{os.path.basename(result['output_path'])}",
    }
