import json
import uuid
import time
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import settings
from feedback.feedback_store import get_top_examples
from tools.docx_tool import generate_docx
from tools.pptx_tool import generate_pptx
from tools.pdf_tool import generate_pdf
from tools.excel_tool import generate_excel

def _get_llm() -> ChatGroq:
    return ChatGroq(
        model=settings.groq_model,
        groq_api_key=settings.groq_api_key,
        temperature=0.7,
    )

def _invoke(prompt: str, retries: int = 3) -> str:
    llm = _get_llm()
    chain = ChatPromptTemplate.from_messages([("human", "{input}")]) | llm | StrOutputParser()
    for attempt in range(retries):
        try:
            raw = chain.invoke({"input": prompt})
            return raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        except Exception as e:
            if "429" in str(e) and attempt < retries - 1:
                wait = 5 * (attempt + 1)
                print(f"Rate limited, retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def _brand_context(brand: dict) -> str:
    return (
        f"Brand name: {brand.get('name', 'Unknown')}\n"
        f"Tone: {brand.get('tone', 'professional')}\n"
        f"Industry: {brand.get('industry', 'general')}\n"
        f"Tagline: {brand.get('tagline', '')}\n"
    )


def _render_file(parsed, doc_type: str, output_format: str, topic: str, brand: dict, doc_id: str) -> str:
    filename = f"{doc_id}.{output_format}"
    # Normalize: if LLM returned a list for a non-presentation, wrap it
    if isinstance(parsed, list):
        if output_format == "pptx":
            return generate_pptx(title=topic, slides_content=parsed, brand=brand, filename=filename)
        else:
            # Convert list of items into a single content string
            content = "\n\n".join(
                item.get("body", item.get("content", str(item))) if isinstance(item, dict) else str(item)
                for item in parsed
            )
            title = topic
    else:
        title = parsed.get("title", topic)
        content = parsed.get("content", "")

    if output_format == "pptx":
        slides = parsed if isinstance(parsed, list) else parsed.get("slides", [{"title": topic, "body": content}])
        return generate_pptx(title=topic, slides_content=slides, brand=brand, filename=filename)
    elif output_format == "docx":
        return generate_docx(title=title, content=content, brand=brand, filename=filename)
    elif output_format == "pdf":
        return generate_pdf(title=title, content=content, brand=brand, filename=filename)
    elif output_format == "xlsx":
        return generate_excel(title=title, content=content, brand=brand, filename=filename)


# ── 1. CREATE ────────────────────────────────────────────────────────────────

def create_document(topic: str, doc_type: str, output_format: str, brand: dict) -> dict:
    examples = get_top_examples(topic)
    examples_ctx = ("\n\nHighly-rated past examples:\n" + "\n---\n".join(examples[:2])) if examples else ""
    brand_ctx = _brand_context(brand)

    if doc_type == "presentation":
        prompt = (
            f"You are a brand-aware document creator.\n{brand_ctx}{examples_ctx}\n\n"
            f"Create a professional presentation on: {topic}\n"
            f"Return a JSON array of slide objects with 'title' and 'body' keys. 5-7 slides. ONLY valid JSON."
        )
    else:
        prompt = (
            f"You are a brand-aware document creator.\n{brand_ctx}{examples_ctx}\n\n"
            f"Create a professional {doc_type} on: {topic}\n"
            f"Return a JSON object with 'title' (string) and 'content' (string, paragraphs separated by \\n\\n). ONLY valid JSON."
        )

    parsed = json.loads(_invoke(prompt))
    doc_id = str(uuid.uuid4())[:8]
    output_path = _render_file(parsed, doc_type, output_format, topic, brand, doc_id)

    return {
        "doc_id": doc_id,
        "output_path": output_path,
        "raw_content": parsed,
        "topic": topic,
        "doc_type": doc_type,
        "output_format": output_format,
    }


# ── 2. REVIEW ────────────────────────────────────────────────────────────────

def review_document(raw_content, doc_type: str, brand: dict) -> dict:
    brand_ctx = _brand_context(brand)
    content_str = json.dumps(raw_content, indent=2)

    prompt = (
        f"You are a senior editor reviewing a {doc_type} for brand compliance and quality.\n"
        f"{brand_ctx}\n\n"
        f"Document content:\n{content_str}\n\n"
        f"Return a JSON object with:\n"
        f"- 'score': integer 1-10\n"
        f"- 'strengths': list of strings\n"
        f"- 'issues': list of strings\n"
        f"- 'suggestions': list of specific improvement suggestions\n"
        f"- 'brand_compliance': boolean\n"
        f"ONLY valid JSON."
    )

    return json.loads(_invoke(prompt))


# ── 3. UPDATE (apply feedback) ────────────────────────────────────────────────

def update_document(
    raw_content,
    doc_type: str,
    output_format: str,
    topic: str,
    brand: dict,
    feedback: str,
    doc_id: str,
) -> dict:
    brand_ctx = _brand_context(brand)
    content_str = json.dumps(raw_content, indent=2)

    if doc_type == "presentation":
        format_instruction = "Return a JSON array of slide objects with 'title' and 'body' keys. ONLY valid JSON."
    else:
        format_instruction = "Return a JSON object with 'title' and 'content' keys. ONLY valid JSON."

    prompt = (
        f"You are a brand-aware document editor.\n{brand_ctx}\n\n"
        f"Original document:\n{content_str}\n\n"
        f"Requested changes:\n{feedback}\n\n"
        f"Rewrite the document incorporating all the feedback. {format_instruction}"
    )

    parsed = json.loads(_invoke(prompt))
    new_doc_id = f"{doc_id}_v2"
    output_path = _render_file(parsed, doc_type, output_format, topic, brand, new_doc_id)

    return {
        "doc_id": new_doc_id,
        "output_path": output_path,
        "raw_content": parsed,
        "topic": topic,
        "doc_type": doc_type,
        "output_format": output_format,
    }
