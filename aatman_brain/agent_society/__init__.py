"""
Agent Society for AATMAN OS.

An advanced architecture that evolved from the original MVP
by integrating: Reasoning Engine, Memory, Knowledge Base, and
Explainability for a complete self-evolving system.
"""

from .council import AgentCouncil
from .reasoning_council import ReasoningCouncil
from .memory_council import MemoryCouncil
from .knowledge_council import KnowledgeCouncil
from .execution_council import ExecutionCouncil
from .feedback_council import FeedbackCouncil
from .architecture_council import ArchitectureCouncil

from .config import get_config
from .state import AgentSocietyState

# Version
__version__ = "1.0.0"


__all__ = [
    "AgentCouncil",
    "ReasoningCouncil",
    "MemoryCouncil",
    "KnowledgeCouncil",
    "ExecutionCouncil",
    "FeedbackCouncil",
    "ArchitectureCouncil",
    "get_config",
    "AgentSocietyState",
]
