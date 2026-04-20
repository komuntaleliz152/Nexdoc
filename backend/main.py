import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional

from agents.document_agent import create_document, review_document, update_document, extract_skills
from brand.brand_manager import save_brand, get_brand, list_brands
from feedback.feedback_store import store_feedback
from history.history_store import save_document, get_history, delete_document
from skills.skills_store import save_skill, list_all_skills, delete_skill

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
    output_format: Literal["docx", "pptx", "pdf", "xlsx"]
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
        # Save to history
        save_document(
            doc_id=result["doc_id"],
            topic=req.topic,
            doc_type=req.doc_type,
            output_format=req.output_format,
            brand_id=req.brand_id,
            filename=os.path.basename(result["output_path"]),
            raw_content=result["raw_content"],
        )

        # Auto-review and store high-scoring outputs for self-improvement
        try:
            auto_review = review_document(result["raw_content"], req.doc_type, brand)
            result["auto_review"] = auto_review
            score = auto_review.get("score", 0)
            if score >= 8:
                store_feedback(req.topic, result["output_path"], score, "auto-stored")
                # Extract and save skills from high-scoring docs
                skills = extract_skills(result["raw_content"], req.doc_type, brand, score)
                for skill in skills:
                    save_skill(skill, req.doc_type, brand.get("industry", "general"))
        except Exception:
            result["auto_review"] = None

        return {
            "message": "Document generated",
            "doc_id": result["doc_id"],
            "output_path": result["output_path"],
            "raw_content": result["raw_content"],
            "auto_review": result.get("auto_review"),
            "download_url": f"/download/{os.path.basename(result['output_path'])}",
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
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

    @property
    def validated_rating(self):
        return max(1, min(5, self.rating))


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
    output_format: Literal["docx", "pptx", "pdf", "xlsx"]
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


# --- History endpoints ---

@app.get("/history")
def list_history(limit: int = 20):
    return get_history(limit)


@app.delete("/history/{doc_id}")
def remove_from_history(doc_id: str):
    delete_document(doc_id)
    return {"message": "Deleted"}


# --- Logo endpoint ---

@app.get("/brands/{brand_id}/logo")
def get_logo(brand_id: str):
    from tools.logo_generator import generate_logo
    brand = get_brand(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    path = generate_logo(brand)
    return FileResponse(path, media_type="image/png")


# --- Skills endpoints ---

@app.get("/skills")
def get_skills_list():
    return list_all_skills()


class SkillRequest(BaseModel):
    skill: str
    doc_type: str = "general"
    industry: str = "general"


@app.post("/skills")
def add_skill(req: SkillRequest):
    save_skill(req.skill, req.doc_type, req.industry, source="manual")
    return {"message": "Skill saved"}


@app.delete("/skills/{skill_id}")
def remove_skill(skill_id: str):
    delete_skill(skill_id)
    return {"message": "Skill deleted"}


# --- Stats endpoint ---

@app.get("/stats")
def get_stats():
    from history.history_store import get_history
    from skills.skills_store import list_all_skills
    from feedback.feedback_store import get_top_examples
    docs = get_history(limit=1000)
    skills = list_all_skills()
    return {
        "documents_generated": len(docs),
        "skills_learned": len(skills),
        "brands": len(list_brands()),
    }


@app.get("/health")
def health():
    return {"status": "ok"}
