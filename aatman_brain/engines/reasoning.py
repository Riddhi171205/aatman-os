from __future__ import annotations

import re

from ..llm_client import LLMClient
from ..schemas import Intent, PlanStep
from .base import BaseEngine


class ReasoningEngine(BaseEngine):
    """Understands intent, decomposes goals, and performs self-checks."""

    def __init__(self, llm: LLMClient):
        super().__init__("ReasoningEngine")
        self.llm = llm

    def understand_intent(self, user_input: str) -> Intent:
        self.log(f"Understanding intent for input: {user_input[:50]}...", "debug")
        text = user_input.strip()
        lower = text.lower()
        label = "general_goal"
        urgency = 3

        if any(word in lower for word in ["open", "launch", "start", "run"]):
            label = "action_request"
        if any(word in lower for word in ["plan", "build", "design", "create"]):
            label = "planning_request"
        if any(word in lower for word in ["why", "explain", "compare"]):
            label = "explanation_request"
        if any(word in lower for word in ["urgent", "now", "asap", "immediately"]):
            urgency = 5

        confidence = 0.72 if len(text.split()) > 3 else 0.5
        intent = Intent(label=label, goal=text, urgency=urgency, confidence=confidence)
        self.log(f"Detected intent: {intent.label} (Confidence: {intent.confidence})")
        return intent

    def decompose(self, intent: Intent) -> list[PlanStep]:
        self.log(f"Decomposing intent into steps: {intent.label}", "debug")
        goal = intent.goal.rstrip(".")
        if intent.label == "action_request":
            descriptions = [
                f"Confirm the requested action: {goal}",
                "Check relevant memory and system context",
                "Execute or recommend the safest next action",
                "Report the result and record useful context",
            ]
        elif intent.label == "planning_request":
            descriptions = [
                f"Clarify the objective: {goal}",
                "Retrieve memory and knowledge that may affect the plan",
                "Break the goal into ordered tasks",
                "Evaluate risks, dependencies, and likely outcomes",
                "Return a concise plan with a recommended next step",
            ]
        else:
            descriptions = [
                f"Interpret the request: {goal}",
                "Retrieve relevant memory",
                "Retrieve supporting knowledge",
                "Reason through answer options",
                "Explain the decision with confidence",
            ]

        steps = [
            PlanStep(id=f"step-{index + 1}", description=description, priority=index + 1)
            for index, description in enumerate(descriptions)
        ]
        self.log(f"Generated {len(steps)} plan steps.")
        return steps

    def prioritize(self, plan: list[PlanStep], intent: Intent) -> list[PlanStep]:
        self.log(f"Prioritizing plan steps based on urgency: {intent.urgency}", "debug")
        if intent.urgency >= 5:
            return sorted(plan, key=lambda step: (step.description.startswith("Evaluate"), step.priority))
        return sorted(plan, key=lambda step: step.priority)

    def detect_contradictions(self, user_input: str, context_items: list[str]) -> list[str]:
        self.log("Detecting contradictions in context items.", "debug")
        contradictions: list[str] = []
        lower = user_input.lower()

        for item in context_items:
            item_lower = item.lower()
            if "never" in lower and re.sub(r"\bnever\b", "", lower).strip() in item_lower:
                contradictions.append(f"Current request may conflict with memory: {item[:140]}")
            if "do not" in lower and lower.replace("do not", "").strip() in item_lower:
                contradictions.append(f"Current request may conflict with memory: {item[:140]}")

        if contradictions:
            self.log(f"Found {len(contradictions)} contradiction(s).", "warning")
        return contradictions

    def reflect(self, draft_response: str, contradictions: list[str]) -> str:
        self.log("Reflecting on draft response.", "debug")
        if contradictions:
            return "Response needs caution because the request conflicts with prior context."
        if len(draft_response.strip()) < 20:
            return "Response may be too thin; add a concrete next step."
        return "Response is coherent, relevant, and ready."
