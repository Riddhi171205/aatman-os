# AATMAN OS - Week 2 (AI + Memory Phase)

An experimental AI-native operating system featuring persistent memory, tool execution, and a futuristic dashboard UI. Built with React (Vite) + Tailwind CSS on the frontend, and Node.js (Express) + PostgreSQL + Qdrant on the backend.

## Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (User Data & Chat History)
- **Vector DB**: Qdrant (Embeddings & Long-Term Memory)
- **AI Engine**: Ollama (Local LLM) or Gemini API (Cloud Fallback)

## Features Included (Week 1 & 2)
1. **Modular AI Backend Architecture**: Clean separation in `/backend` using `routes`, `services`, `db`, and `middleware`.
2. **PostgreSQL Integration**: Handles chat logs, user creation, and sessions (fails gracefully to memory mock without `DATABASE_URL` in AI Studio).
3. **Qdrant Integration**: Connects to Vector memory store to index embeddings and query similarities.
4. **Ollama / Gemini Dual Integration**: The `LLMService` attempts to hit a local Ollama endpoint (`http://host.docker.internal:11434`) for high-privacy local generations and embeddings. Falls back to Gemini API.
5. **Memory Retrieval Pipeline**: 
    - Fact extraction from user prompt.
    - Automatic `nomic-embed-text` vector embedding generation.
    - Qdrant similarity search and Context injection block.

## Local Setup (Docker Compose)

### Prerequisites
- Docker & Docker Compose
- Node.js (v20+)
- App requires `DATABASE_URL` and `QDRANT_URL`.

### Setup Instructions

1. Configure `.env`:
Rename `.env.example` to `.env` or just create one:
```env
DATABASE_URL=postgres://root:aatmanos@postgres:5432/aatman
QDRANT_URL=http://qdrant:6333
OLLAMA_URL=http://host.docker.internal:11434
JWT_SECRET=super_secret_aatman_key
# GEMINI_API_KEY=your_google_ai_key (optional fallback)
```

2. Start the services:
```bash
docker-compose up -d --build
```

3. The system should now be available at `http://localhost:3000`.
   - Node API & Frontend runs on port `3000`.
   - Postgres runs on port `5432`.
   - Qdrant runs on port `6333`.

> **Note**: For local LLM processing via Ollama, ensure your host has pulled the necessary models:
> `ollama pull llama3`
> `ollama pull nomic-embed-text`


## AATMAN BRAIN (Python Core Intelligence)

The Python brain in `aatman_brain/` (reasoning, memory, knowledge, world model, explainability, agent society) is bridged into the Node backend via `backend/services/brainService.ts`.

```bash
pip install -r requirements-brain.txt
npm run brain        # FastAPI on http://localhost:8001 (docs at /docs)
npm run dev          # in another terminal
```

- Toggle **LLM / BRAIN** in the dashboard top bar to route chat through the brain. If the brain is unreachable, chat falls back to the NVIDIA → Ollama → Gemini chain automatically.
- `POST /api/chat` accepts `engine: "llm" | "brain"`; brain replies include `observability.brain` (intent, plan, simulation, explanation).
- Brain endpoints (JWT required except status): `GET /api/brain/status`, `POST /api/brain/think`, `POST /api/brain/agents/run`, `POST /api/brain/agents/feedback`, `POST /api/brain/memory`, `GET /api/brain/retrieve`, `POST /api/brain/knowledge/text`. Brain memory is namespaced per user.
- Config: `BRAIN_URL` (Node side), `AATMAN_LLM_PROVIDER=local|ollama|openai`, `AATMAN_DATA_DIR` (default `data/`). See `aatman_brain/config.py`.
