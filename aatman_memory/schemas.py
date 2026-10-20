from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class MemoryRecord:
    """Canonical memory shape stored across memory layers."""

    input: str
    plan: str = ""
    action: dict[str, Any] = field(default_factory=dict)
    result: str = ""
    session_id: str = "default"
    tags: list[str] = field(default_factory=list)
    importance: float = 0.5
    id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=now_iso)

    def text(self) -> str:
        return " ".join(
            [
                self.input,
                self.plan,
                str(self.action),
                self.result,
                " ".join(self.tags),
            ]
        ).strip()

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "input": self.input,
            "plan": self.plan,
            "action": self.action,
            "result": self.result,
            "tags": self.tags,
            "importance": self.importance,
            "timestamp": self.timestamp,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "MemoryRecord":
        return cls(
            id=str(data.get("id") or uuid4()),
            session_id=str(data.get("session_id") or "default"),
            input=str(data.get("input") or ""),
            plan=str(data.get("plan") or ""),
            action=data.get("action") if isinstance(data.get("action"), dict) else {},
            result=str(data.get("result") or ""),
            tags=list(data.get("tags") or []),
            importance=float(data.get("importance", 0.5)),
            timestamp=str(data.get("timestamp") or now_iso()),
        )


@dataclass
class RetrievedMemory:
    record: MemoryRecord
    source: str
    score: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "score": self.score,
            "record": self.record.to_dict(),
        }

