from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class Intent:
    label: str
    goal: str
    entities: dict[str, Any] = field(default_factory=dict)
    urgency: int = 3
    confidence: float = 0.55


@dataclass
class PlanStep:
    id: str
    description: str
    priority: int
    dependencies: list[str] = field(default_factory=list)
    status: str = "pending"


@dataclass
class MemoryItem:
    id: str
    session_id: str
    content: str
    kind: str = "conversation"
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=utc_now_iso)

    @classmethod
    def create(
        cls,
        session_id: str,
        content: str,
        kind: str = "conversation",
        metadata: dict[str, Any] | None = None,
    ) -> "MemoryItem":
        return cls(
            id=str(uuid4()),
            session_id=session_id,
            content=content,
            kind=kind,
            metadata=metadata or {},
        )


@dataclass
class RetrievedItem:
    source: str
    content: str
    score: float
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class WorldSimulation:
    summary: str
    predicted_outcomes: list[str]
    risks: list[str]
    confidence: float


@dataclass
class BrainDecision:
    response: str
    intent: Intent
    plan: list[PlanStep]
    memory_context: list[RetrievedItem]
    knowledge_context: list[RetrievedItem]
    simulation: WorldSimulation
    explanation: dict[str, Any]
    session_id: str
