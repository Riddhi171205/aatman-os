from __future__ import annotations

import logging
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from ..brain import AatmanBrain, decision_to_dict
from ..agent_society.orchestrator import AgentOrchestrator, society_run_to_dict

# -----------------------------
# Configuration & Logging
# -----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("AATMAN_API_MAIN")

# -----------------------------
# App Initialization
# -----------------------------
app = FastAPI(
    title="AATMAN BRAIN Core Intelligence",
    description="Modular AI brain service for AATMAN OS.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend UI integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Dependencies
# -----------------------------
_brain_instance = AatmanBrain()
_agent_orchestrator = AgentOrchestrator()

def get_brain() -> AatmanBrain:
    return _brain_instance

def get_orchestrator() -> AgentOrchestrator:
    return _agent_orchestrator


# -----------------------------
# Schemas
# -----------------------------
class ThinkRequest(BaseModel):
    input: str = Field(..., min_length=1, description="User input query")
    session_id: Optional[str] = Field(default=None, description="Optional session ID")


class AgentSocietyRunRequest(BaseModel):
    goal: str = Field(..., min_length=1, description="Goal for the agent society")
    session_id: Optional[str] = Field(default=None, description="Optional session ID")


class AgentFeedbackRequest(BaseModel):
    session_id: str = Field(..., min_length=1, description="Session ID for the run")
    goal: str = Field(..., min_length=1, description="Original goal")
    feedback: str = Field(..., min_length=1, description="Feedback text")
    score: Optional[int] = Field(default=None, ge=1, le=5, description="Score from 1 to 5")


class RememberRequest(BaseModel):
    session_id: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    kind: str = Field(default="fact")


class IngestTextRequest(BaseModel):
    name: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)


class IngestUrlRequest(BaseModel):
    url: str = Field(..., min_length=1)


class IngestFilePathRequest(BaseModel):
    path: str = Field(..., min_length=1)


# -----------------------------
# Routes
# -----------------------------

@app.get("/health", tags=["System"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "aatman-brain"}


@app.post("/think", tags=["Core Intelligence"])
def think(request: ThinkRequest, brain: AatmanBrain = Depends(get_brain)) -> dict:
    try:
        decision = brain.think(user_input=request.input, session_id=request.session_id)
        return decision_to_dict(decision)
    except Exception as e:
        logger.error(f"Error in /think: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/run", tags=["Agent Society"])
def run_agent_society(request: AgentSocietyRunRequest, orchestrator: AgentOrchestrator = Depends(get_orchestrator)) -> dict:
    try:
        run = orchestrator.run(goal=request.goal, session_id=request.session_id)
        return society_run_to_dict(run)
    except Exception as e:
        logger.error(f"Error in /agents/run: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agents/feedback", tags=["Agent Society"])
def add_agent_feedback(request: AgentFeedbackRequest, orchestrator: AgentOrchestrator = Depends(get_orchestrator)) -> dict:
    try:
        return orchestrator.add_feedback(
            session_id=request.session_id,
            goal=request.goal,
            feedback=request.feedback,
            score=request.score,
        )
    except Exception as e:
        logger.error(f"Error in /agents/feedback: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/memory", tags=["Memory"])
def remember(request: RememberRequest, brain: AatmanBrain = Depends(get_brain)) -> dict:
    try:
        item = brain.remember(
            session_id=request.session_id,
            content=request.content,
            kind=request.kind,
        )
        return item.__dict__
    except Exception as e:
        logger.error(f"Error in /memory: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/retrieve", tags=["Memory"])
def retrieve(query: str, session_id: Optional[str] = None, brain: AatmanBrain = Depends(get_brain)) -> dict:
    try:
        return brain.retrieve(query=query, session_id=session_id)
    except Exception as e:
        logger.error(f"Error in /retrieve: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge/text", tags=["Knowledge Base"])
def ingest_text(request: IngestTextRequest, brain: AatmanBrain = Depends(get_brain)) -> dict[str, str]:
    try:
        path = brain.ingest_text(name=request.name, content=request.content)
        return {"status": "ingested", "path": str(path)}
    except Exception as e:
        logger.error(f"Error in /knowledge/text: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge/url", tags=["Knowledge Base"])
def ingest_url(request: IngestUrlRequest, brain: AatmanBrain = Depends(get_brain)) -> dict[str, str]:
    try:
        path = brain.ingest_url(request.url)
        return {"status": "ingested", "path": str(path)}
    except Exception as e:
        logger.error(f"Error in /knowledge/url: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/knowledge/file-path", tags=["Knowledge Base"])
def ingest_file_path(request: IngestFilePathRequest, brain: AatmanBrain = Depends(get_brain)) -> dict[str, str]:
    try:
        path = brain.ingest_file(request.path)
        return {"status": "ingested", "path": str(path)}
    except Exception as e:
        logger.error(f"Error in /knowledge/file-path: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
