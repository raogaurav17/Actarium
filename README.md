# Actarium — Library of Legal Acts

AI-powered legal knowledge centre for Indian citizens. Browse, understand, and ask questions about Indian laws in plain language.

## Features

- **Knowledge Cards** — AI-generated summaries of 5 major Indian laws
- **Plain-Language Summaries** — Gemini 2.5 Flash explains each act in simple terms
- **Key Information** — Structured rights, penalties, provisions, and beneficiaries
- **Audio Summaries** — TTS audio (Google Cloud TTS or gTTS fallback)
- **RAG Chat** — Ask questions; answers grounded in the actual legal text (LangGraph + ChromaDB)
- **Semantic Search** — Vector similarity search across all topics
- **Supabase Auth** — Email/password and Google OAuth (optional)

## Architecture

```
frontend (Next.js 16 + Tailwind v4)
    ↕ REST API
backend (FastAPI + uvicorn)
    ├── Ingestion Pipeline         ingest.py: hash → chunk → embed → persist
    ├── LangGraph RAG agent        retrieve → generate → validate
    ├── ChromaDB                   vector store (local persistent)
    └── Supabase                   structured data + auth + chat history
```

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Google Gemini 2.5 Flash (`langchain-google-genai`) |
| Embeddings | `gemini-embedding-001` via `langchain-chroma` |
| Orchestration | LangGraph `StateGraph` (RAG agent) |
| Vector DB | ChromaDB (local persistent) |
| Database | Supabase (PostgreSQL) |
| Backend | FastAPI + uvicorn |
| Frontend | Next.js 16 + Tailwind v4 |

## Legal Topics Covered

1. **POCSO Act** — Protection of Children from Sexual Offences Act, 2012
2. **Consumer Protection Act** — Consumer Protection Act, 2019
3. **Cyber Crime Laws** — IT Act, 2000 (Cyber Crime Provisions)
4. **Right to Information** — RTI Act, 2005
5. **GST Registration** — CGST Act, 2017 (Registration Provisions)

---

## Local Setup

### Prerequisites

- Python 3.11+, [`uv`](https://docs.astral.sh/uv/) package manager
- Node.js 20+, npm
- Google Gemini API key (free at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- Supabase project (free at [supabase.com](https://supabase.com)) — optional for local dev

### 1. Backend

```bash
cd backend

# Install dependencies
uv pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set GEMINI_API_KEY at minimum

# Create Supabase tables (if using Supabase)
# Paste db/schema.sql into Supabase SQL Editor and run

# Start the API server
uv run uvicorn main:app --reload --port 8000
```
Note: On startup, `sync_vector_db()` in `pipeline/ingest.py` will automatically run to ingest all `.txt` documents from `data/raw/` into the local ChromaDB vector store.

The backend is now at `http://localhost:8000`. API docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start dev server
npm run dev
```

The frontend is at `http://localhost:3000`.

### 3. Docker (full stack)

```bash
# Ensure backend/.env and frontend/.env.local are filled in
docker-compose up --build
```

---

## Deployment

### Backend → Render.com

1. Push repo to GitHub
2. New Web Service → connect repo → set root to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `backend/.env.example`
6. Add a persistent disk at `/app/data` and `/app/chroma_db`

### Frontend → Vercel

1. Import repo on Vercel → set root to `frontend/`
2. Framework: Next.js (auto-detected)
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL` — your Render backend URL
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |
| `SUPABASE_URL` | Yes* | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes* | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Yes* | Supabase service role key |
| `FRONTEND_URL` | No | CORS origin (default: localhost:3000) |

*Supabase keys are required for persistent chat/user storage; knowledge base data uses fallback local JSON files if missing.

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase URL (for auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key (for auth) |

---

## Data Pipeline

The knowledge base leverages an automated ingestion pipeline (`pipeline/ingest.py`):
1. Reads legal text from local files (`data/raw/`)
2. Computes SHA256 hashes to skip redundant processing
3. Chunks text using `RecursiveCharacterTextSplitter`
4. Embeds & persists into ChromaDB using `gemini-embedding-001`
5. Topic summaries, key info, and audio files are pre-generated and stored in `data/generated/` and `data/audio/`.

---

## Legal Disclaimer

AI-generated summaries are for informational purposes only. Always consult a qualified lawyer for legal advice.
