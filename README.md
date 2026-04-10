# NexDoc — Self-Improving Brand-Aware AI Document Generator

NexDoc is an agentic AI platform that generates, reviews, and iteratively improves brand-aware documents. Every document reflects your brand's tone, color, font, and identity — and the agent gets smarter with every use.

## Features

- Generate reports, proposals, presentations, and briefs
- Export to PDF, DOCX, PPTX, and Excel
- Brand profiles with custom colors, fonts, tone, and auto-generated logos
- AI review — scores documents 1-10 with strengths, issues, and suggestions
- Request changes — agent rewrites the document based on your feedback
- Self-improvement loop — high-scoring documents are analyzed and writing patterns saved as skills
- Document history — all generated docs saved and re-downloadable
- Skills tab — view and add writing rules the agent applies to future generations

## Stack

- Backend: Python, FastAPI, LangChain, Groq (Llama 3.3 70B)
- Storage: ChromaDB (brand profiles, feedback, skills, history)
- Export: python-docx, python-pptx, ReportLab, XlsxWriter, Pillow
- Frontend: Next.js, Tailwind CSS

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# Add your GROQ_API_KEY to .env
pip install -r requirements.txt
pip install langchain-groq
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How the self-improvement works

1. Every generated document is auto-reviewed and scored
2. Documents scoring 8+/10 have writing patterns extracted as skills
3. Skills are stored in ChromaDB and injected into future prompts
4. Users can also add manual skills via the Skills tab
5. Past high-rated documents are used as few-shot examples for similar topics

## Environment Variables

```
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
CHROMA_PERSIST_DIR=./chroma_db
OUTPUT_DIR=./outputs
```
