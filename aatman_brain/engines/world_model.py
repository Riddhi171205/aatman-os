from __future__ import annotations

from ..schemas import Intent, PlanStep, WorldSimulation


class WorldModel:
    """Basic scenario simulator for likely outcomes and risks."""

    def simulate(self, intent: Intent, plan: list[PlanStep]) -> WorldSimulation:
        lower_goal = intent.goal.lower()
        outcomes = [
            "The user receives a structured answer instead of a raw chatbot reply.",
            f"The system follows {len(plan)} planned step(s) before responding.",
        ]
        risks: list[str] = []
        confidence = 0.68

        if any(word in lower_goal for word in ["delete", "remove", "overwrite", "reset"]):
            risks.append("The goal may change or destroy existing state.")
            confidence -= 0.12
        if any(word in lower_goal for word in ["install", "update", "download", "api", "search"]):
            risks.append("The goal may depend on external tools, permissions, or network availability.")
            confidence -= 0.08
        if intent.confidence < 0.6:
            risks.append("Intent confidence is moderate; clarification may improve execution.")
            confidence -= 0.05

        if not risks:
            risks.append("No major risk detected in the MVP world model.")

        return WorldSimulation(
            summary="AATMAN simulated the likely path before answering.",
            predicted_outcomes=outcomes,
            risks=risks,
            confidence=max(0.1, min(confidence, 0.95)),
        )
