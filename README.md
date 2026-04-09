# NexDoc — Brand-Aware AI Document Generator

## Stack
- Backend: Python + FastAPI + LangChain + Gemini 1.5 Pro
- Frontend: Next.js + Tailwind CSS
- Storage: ChromaDB (brand memory + feedback)
- Output: PDF, DOCX, PPTX

## Setup

### Backend
```bash
cd backend
cp .env.example .env
# Add your GEMINI_API_KEY to .env
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## How it works
1. Create a brand profile (name, tone, colors, font)
2. Generate a document by entering a topic, choosing type and format
3. Download the generated PDF / DOCX / PPTX
4. Rate the output — ratings are stored in ChromaDB and used to improve future generations
