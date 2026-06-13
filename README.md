#  Actarium — Library of Legal Acts

> **AI-powered Legal Knowledge Centre** — Making Indian law accessible to every citizen.

[![Deploy Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://actarium.vercel.app)
[![Deploy Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://actarium-backend.onrender.com)

---

##  Project Overview

**Actarium** (Latin: *Library of Acts*) is a full-stack AI product that automatically ingests publicly available Indian legal documents, processes them through an AI pipeline, and presents structured, understandable legal knowledge to citizens.

No content is manually written. Everything is **automatically generated** from official government sources.

### Covered Legal Topics

| Topic | Source |
|---|---|
|  POCSO Act 2012 | India Code |
|  Consumer Protection Act 2019 | Consumer Affairs Ministry |
|  Cyber Crime Laws (IT Act 2000) | India Code |
|  Right to Information Act 2005 | RTI.gov.in |
|  GST Registration (CGST Act 2017) | GST.gov.in |

---

##  Architecture

```
Legal Sources (Gov PDFs/HTML)
        ↓
  LangChain PyPDFLoader / BSHTMLLoader (Scraper)
        ↓
  LangChain RecursiveCharacterTextSplitter (Chunker)
        ↓
  LangChain GoogleGenerativeAIEmbeddings → LangChain-Chroma (Vector Store)
        ↓

        ↓
  LangChain ChatGoogleGenerativeAI (Gemini 1.5 Flash)
  ├── Card Description  (LangChain ChatPromptTemplate)
  ├── Plain Summary     (LangChain LCEL chain)
  ├── Key Info JSON     (LangChain structured output)
  └── RAG Answers       (LangChain create_retrieval_chain)
        ↓
  Google TTS / gTTS (MP3 Audio)
        ↓
  Supabase (Postgres + Storage)
        ↓
  FastAPI (REST API — Render.com)
  ├── /api/chat → LangGraph RAG Agent
  │   [retrieve] → [generate] → [validate] → END
  │   (MemorySaver for conversation state)
  └── /api/search → LangChain-Chroma similarity search
        ↓
  Next.js 14 (Frontend — Vercel)
```

---

##  AI Models Used

| Model | Purpose | Provider |
|---|---|---|
| `gemini-1.5-flash` | Summaries, key info, RAG answers | Google AI Studio (free) |
| `text-embedding-004` | Semantic embeddings for RAG & search | Google AI Studio (free) |
| `en-IN-Neural2-A` | Text-to-Speech audio | Google Cloud TTS (free tier) |
| `gTTS` | TTS fallback (no API key needed) | gTTS library |

---

##  Technologies

**Backend**
- FastAPI + Uvicorn (Python 3.11)
- **LangChain** (`langchain`, `langchain-core`, `langchain-community`)
  - `PyPDFLoader` + `BSHTMLLoader` — document loading
  - `RecursiveCharacterTextSplitter` — text chunking
  - `GoogleGenerativeAIEmbeddings` — semantic embeddings
  - `ChatGoogleGenerativeAI` — LLM calls
  - `ChatPromptTemplate` + LCEL — prompt chains
  - `create_retrieval_chain` — RAG chain
- **LangChain-Chroma** (`langchain-chroma`) — vector store integration
- **LangGraph** (`langgraph`) — workflow orchestration
  - `StateGraph` — seed pipeline (6 nodes, conditional edges)
  - `StateGraph` — RAG agent (retrieve → generate → validate)
  - `MemorySaver` — in-memory conversation checkpointing
- ChromaDB (persistent vector database)
- Supabase (Postgres + Storage + Auth)
- `google-cloud-texttospeech` + `gTTS` (audio generation)
- `slowapi` (rate limiting)

**Frontend**
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + custom design system
- Supabase JS (auth client)
- Web Speech API (voice input/STT)
- HTML5 Audio API (custom player)

**Infrastructure**
- Vercel (frontend, free)
- Render.com (backend, free)
- Supabase (database + auth, free)
- GitHub Actions (CI/CD)
- Docker + Docker Compose (local dev)

---

##  Setup Instructions

### Prerequisites
- Python 3.11+, `uv` or pip
- Node.js 20+, npm
- [Gemini API Key](https://aistudio.google.com/app/apikey) (free)
- [Supabase account](https://supabase.com) (free)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/actarium.git
cd actarium
```

### 2. Backend Setup
```bash
cd backend
uv venv && source .venv/bin/activate   # or: python -m venv venv && source venv/bin/activate
uv pip install -r requirements.txt

cp .env.example .env
# Edit .env — add GEMINI_API_KEY and Supabase credentials
```

### 3. Database Setup (Supabase)
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Paste contents of `backend/db/schema.sql` → **Run**



### 5. Start Backend
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
# API docs: http://localhost:8000/docs
```

### 6. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
# Open: http://localhost:3000
```

### Local with Docker
```bash
# From project root:
docker-compose up --build
```

---

##  Deployment

### Frontend → Vercel (Free)
```bash
cd frontend
npx vercel --prod
# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Backend → Render.com (Free)
1. Connect GitHub repo to Render
2. Create Web Service → `backend/` directory
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard



---

##  Features

| Feature | Status |
|---|---|
| AI Knowledge Cards |  Auto-generated from legal text |
| Plain-language Summaries |  Gemini 1.5 Flash, ≤250 words |
| Key Information Extraction |  Rights, Provisions, Penalties, Beneficiaries |
| AI Legal Assistant (RAG) |  ChromaDB + Gemini, grounded answers |
| Audio Summaries |  Google TTS / gTTS fallback |
|  Semantic AI Search |  Cross-topic embedding search |
|  Source Citations |  Every RAG answer cites the legal text |
|  Vector Database |  ChromaDB persistent collection |
|  Chat History |  Supabase (session-scoped) |
|  Speech-to-Text |  Web Speech API (browser native) |
|  Authentication |  Supabase Auth (email + Google OAuth) |
|  Dockerization |  docker-compose.yml |
|  Deployment |  Vercel + Render |
|  Multi-language |  Planned (Gemini translate) |

---

##  Security

- All API keys in environment variables only (never hardcoded)
- Rate limiting: 60 req/min per IP (slowapi)
- Input validation: Pydantic schemas, length limits
- CORS: restricted to frontend domain
- Security headers: CSP, X-Frame-Options, nosniff
- JWT via HttpOnly cookies (not localStorage)
- SQL: Supabase ORM (no string concatenation)
- XSS: React JSX auto-escaping, no dangerouslySetInnerHTML
- Path traversal: allow-list slug validation for audio serving

---

##  Automation Pipeline

The core value of Actarium is the **fully automated LangChain + LangGraph pipeline**:

```


LangGraph RAG Agent (/api/chat)
────────────────────────────────
Node 1: RETRIEVE → LangChain VectorStoreRetriever (ChromaDB, topic-scoped)
Node 2: GENERATE → LangChain create_retrieval_chain (context + history → Gemini)
Node 3: VALIDATE → Quality check; retries once if answer too short
MemorySaver: In-memory conversation checkpointing per session
```



---

##  Challenges Faced

1. **Gemini rate limits** — Batched embedding with 0.5s delays; added exponential backoff
2. **ChromaDB on Render** — Persistent disk required; configured `mountPath: /app/data`
3. **Audio streaming** — Served via FileResponse with `Content-Disposition: inline` for browser playback
4. **RAG accuracy** — Scoped ChromaDB queries by `topic_slug` metadata filter to prevent cross-topic bleed

---

##  Future Improvements

- [ ] Multi-language summaries (Hindi, Tamil, Bengali) via Gemini
- [ ] User accounts with saved notes and bookmarks
- [ ] More legal topics (IPC, POSH Act, Domestic Violence Act)
- [ ] PDF document upload — analyze any legal document
- [ ] WhatsApp/Telegram bot integration
- [ ] Mobile app (React Native)
- [ ] Real-time legal news integration
- [ ] Lawyer directory integration

---

##  Architecture Diagram

See `docs/architecture.png` or the diagram in the Implementation Plan.

---

*Actarium is for informational purposes only. Always consult a qualified lawyer for legal advice.*
