from __future__ import annotations

from typing import Any

from ..schemas import Intent, PlanStep, RetrievedItem, WorldSimulation
from .base import BaseEngine


class ExplainabilityEngine(BaseEngine):
    """Produces transparent reasoning metadata for the final answer."""

    def __init__(self):
        super().__init__("ExplainabilityEngine")

    def explain(
        self,
        intent: Intent,
        plan: list[PlanStep],
        memory: list[RetrievedItem],
        knowledge: list[RetrievedItem],
        simulation: WorldSimulation,
        contradictions: list[str],
        reflection: str,
    ) -> dict[str, Any]:
        self.log(f"Generating explanation for intent: {intent.label}", "debug")
        confidence_parts = [
            intent.confidence,
            simulation.confidence,
            0.75 if plan else 0.4,
            0.72 if memory or knowledge else 0.58,
        ]
        if contradictions:
            confidence_parts.append(0.42)

        confidence = round(sum(confidence_parts) / len(confidence_parts), 2)
        alternatives = [
            "Ask a clarifying question before acting.",
            "Produce a plan only, without execution.",
            "Use external retrieval if the task depends on current facts.",
        ]

        explanation = {
            "why": [
                f"Intent classified as {intent.label}.",
                f"Plan created with {len(plan)} step(s).",
                f"Retrieved {len(memory)} memory item(s) and {len(knowledge)} knowledge item(s).",
                simulation.summary,
            ],
            "alternatives": alternatives,
            "contradictions": contradictions,
            "reflection": reflection,
            "confidence": confidence,
        }
        self.log(f"Explanation generated with confidence {confidence}.")
        return explanation
