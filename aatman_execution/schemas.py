from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class ExecutionResult:
    success: bool
    type: str
    action: str
    message: str
    data: dict[str, Any] = field(default_factory=dict)
    error: str | None = None
    id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=now_iso)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "success": self.success,
            "type": self.type,
            "action": self.action,
            "message": self.message,
            "data": self.data,
            "error": self.error,
        }


def ok(action_type: str, action: str, message: str, data: dict[str, Any] | None = None) -> ExecutionResult:
    return ExecutionResult(
        success=True,
        type=action_type,
        action=action,
        message=message,
        data=data or {},
    )


def fail(action_type: str, action: str, message: str, error: str | None = None) -> ExecutionResult:
    return ExecutionResult(
        success=False,
        type=action_type,
        action=action,
        message=message,
        error=error or message,
    )

