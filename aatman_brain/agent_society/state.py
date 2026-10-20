from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentSocietyState:
    """Represents the global state of the Agent Society."""
    history: list[dict[str, Any]] = field(default_factory=list)
    error_count: int = 0
    last_execution_success: bool = True
