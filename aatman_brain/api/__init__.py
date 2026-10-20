"""
FastAPI entrypoints for AATMAN Brain.
"""

import logging
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .. import AATMANBrain

# -----------------------------
# Configuration & Logging
# -----------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("AATMAN_API")

# -----------------------------
# App Initialization
# -----------------------------
app = FastAPI(
    title="AATMAN Brain API",
    version="1.1.0",
    description="Advanced Core Intelligence API for AATMAN OS",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Dependencies
# -----------------------------
# Global instance
_brain_instance = AATMANBrain()

def get_brain() -> AATMANBrain:
    """Dependency injection for the AATMAN Brain."""
    return _brain_instance


# -----------------------------
# Request / Response Schemas
# -----------------------------
class InputRequest(BaseModel):
    user_input: str = Field(..., min_length=1, description="The command or query for the Brain to process.")
    session_id: Optional[str] = Field(default=None, description="Optional session identifier for tracking memory.")


class BrainResponse(BaseModel):
    status: str = Field(..., description="Success or error status.")
    result: Optional[Dict[str, Any]] = Field(default=None, description="The structured result from the Brain.")
    explanation: Optional[Dict[str, Any]] = Field(default=None, description="Explainability metadata.")
    message: Optional[str] = Field(default=None, description="Optional message or error details.")


# -----------------------------
# Routes
# -----------------------------

@app.get("/", tags=["System"])
def root() -> Dict[str, str]:
    """Root endpoint to verify API connectivity."""
    return {"message": "AATMAN Brain API is running 🚀"}


@app.get("/health", tags=["System"])
def health_check() -> Dict[str, str]:
    """Health check endpoint for monitoring services."""
    return {
        "status": "healthy",
        "service": "AATMAN Brain API",
        "version": app.version
    }


@app.post("/process", response_model=BrainResponse, tags=["Intelligence"])
def process_input(request: InputRequest, brain: AATMANBrain = Depends(get_brain)):
    """
    Main Intelligence Endpoint:
    Takes user input → Recalls Memory → Reasons → Fetches Knowledge → Explains → Returns output.
    """
    try:
        logger.info(f"Processing request [Session: {request.session_id or 'default'}]: {request.user_input[:50]}...")

        # Run the core AATMANBrain pipeline
        response = brain.process(request.user_input)

        logger.info("Successfully processed input.")
        
        # Ensure we always return a valid BrainResponse matching the schema
        return BrainResponse(
            status=response.get("status", "success"),
            result=response.get("result"),
            explanation=response.get("explanation"),
            message=response.get("message")
        )

    except ValueError as ve:
        logger.warning(f"Validation error during processing: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    
    except Exception as e:
        logger.error(f"Critical API Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An internal server error occurred while processing the request."
        )
