from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from ..llm_client import LLMClient
from .schemas import AgentResult, SocietyContext


class BaseAgent(ABC):
    """Base class for all AATMAN society agents."""

    name: str = "base"
    role: str = "General collaborator"

    def __init__(self, llm: LLMClient):
        self.llm = llm

    @abstractmethod
    def run(self, context: SocietyContext) -> AgentResult:
        """Execute the agent's role against shared society context."""

    def think(self, context: SocietyContext, prompt: str, fallback: str) -> str:
        system = (
            f"You are {self.name}, part of the AATMAN OS agent society. "
            f"Role: {self.role}. Think calmly, communicate clearly, and collaborate with other agents."
        )
        shared = "\n".join(f"- {item}" for item in context.shared_memory) or "- none"
        user = f"Goal: {context.goal}\nTask type: {context.task_type}\nShared guidance:\n{shared}\n\n{prompt}"
        return self.llm.complete(system=system, user=user, fallback=fallback)

    def result(
        self,
        summary: str,
        output: dict[str, Any],
        confidence: float,
        context: SocietyContext,
    ) -> AgentResult:
        message = context.add_message(
            sender=self.name,
            receiver="orchestrator",
            content=summary,
            confidence=confidence,
        )
        return AgentResult(
            agent_name=self.name,
            summary=summary,
            output=output,
            confidence=confidence,
            messages=[message],
        )

