from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AgentMessage:
    sender: str
    receiver: str
    content: str
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=now_iso)


@dataclass
class AgentTask:
    id: str
    description: str
    priority: int
    owner: str = "executor"
    status: str = "pending"
    dependencies: list[str] = field(default_factory=list)

    @classmethod
    def create(cls, description: str, priority: int, owner: str = "executor") -> "AgentTask":
        return cls(id=str(uuid4()), description=description, priority=priority, owner=owner)


@dataclass
class AgentResult:
    agent_name: str
    summary: str
    output: dict[str, Any]
    confidence: float
    messages: list[AgentMessage] = field(default_factory=list)


@dataclass
class SocietyContext:
    session_id: str
    goal: str
    task_type: str
    shared_memory: list[str] = field(default_factory=list)
    messages: list[AgentMessage] = field(default_factory=list)
    artifacts: dict[str, Any] = field(default_factory=dict)

    def add_message(self, sender: str, receiver: str, content: str, **metadata: Any) -> AgentMessage:
        message = AgentMessage(sender=sender, receiver=receiver, content=content, metadata=metadata)
        self.messages.append(message)
        return message


@dataclass
class SocietyRun:
    session_id: str
    goal: str
    route: list[str]
    final_output: str
    tasks: list[AgentTask]
    agent_results: list[AgentResult]
    messages: list[AgentMessage]
    critique: dict[str, Any]
    refinement: str
    learned_items: list[str]
    confidence: float
    created_at: str = field(default_factory=now_iso)

