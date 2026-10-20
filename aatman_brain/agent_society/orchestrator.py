from __future__ import annotations

from dataclasses import asdict
from uuid import uuid4

from ..config import BrainConfig, get_config
from ..llm_client import LLMClient
from .agents import CriticAgent, ExecutorAgent, PlannerAgent, ResearchAgent
from .memory import AgentSocietyMemory
from .schemas import AgentResult, SocietyContext, SocietyRun


class AgentOrchestrator:
    """Coordinates AATMAN's self-evolving agent society."""

    def __init__(self, config: BrainConfig | None = None):
        self.config = config or get_config()
        self.config.data_dir.mkdir(parents=True, exist_ok=True)
        self.llm = LLMClient(self.config)
        self.memory = AgentSocietyMemory(self.config.data_dir)
        self.agents = {
            "planner": PlannerAgent(self.llm),
            "researcher": ResearchAgent(self.llm),
            "executor": ExecutorAgent(self.llm),
            "critic": CriticAgent(self.llm),
        }

    def run(self, goal: str, session_id: str | None = None) -> SocietyRun:
        session_id = session_id or str(uuid4())
        task_type = self._classify_task(goal)
        route = self._route(task_type)
        shared_guidance = self.memory.retrieve_guidance(goal)
        context = SocietyContext(
            session_id=session_id,
            goal=goal,
            task_type=task_type,
            shared_memory=shared_guidance,
        )
        context.add_message(
            "orchestrator",
            "society",
            f"Starting collaborative run with route: {' -> '.join(route)}",
            task_type=task_type,
        )

        results: list[AgentResult] = []
        for agent_name in route:
            result = self.agents[agent_name].run(context)
            results.append(result)

        refinement = self._refine(context)
        final_output = self._compose_final_output(context, refinement)
        confidence = self._confidence(results)

        run = SocietyRun(
            session_id=session_id,
            goal=goal,
            route=route,
            final_output=final_output,
            tasks=context.artifacts.get("plan", []),
            agent_results=results,
            messages=context.messages,
            critique=context.artifacts.get("critique", {}),
            refinement=refinement,
            learned_items=shared_guidance,
            confidence=confidence,
        )
        self.memory.store_run(asdict(run))
        return run

    def add_feedback(
        self,
        session_id: str,
        goal: str,
        feedback: str,
        score: int | None = None,
    ) -> dict:
        return self.memory.store_feedback(
            session_id=session_id,
            goal=goal,
            feedback=feedback,
            score=score,
        )

    def _classify_task(self, goal: str) -> str:
        lower = goal.lower()
        if any(word in lower for word in ["implement", "build", "code", "create", "fix", "design"]):
            return "implementation"
        if any(word in lower for word in ["research", "compare", "find", "summarize", "investigate"]):
            return "research"
        if any(word in lower for word in ["open", "run", "execute", "send", "update"]):
            return "action"
        return "general"

    def _route(self, task_type: str) -> list[str]:
        if task_type == "action":
            return ["planner", "executor", "critic"]
        if task_type == "general":
            return ["planner", "researcher", "executor", "critic"]
        return ["planner", "researcher", "executor", "critic"]

    def _refine(self, context: SocietyContext) -> str:
        draft = context.artifacts.get("draft_output", {})
        critique = context.artifacts.get("critique", {})
        content = str(draft.get("content", ""))
        improvements = critique.get("improvements", [])

        if critique.get("passed", False):
            return "Critic approved the draft. Minor polish applied for clarity."

        additions = "\n".join(f"- {item}" for item in improvements)
        refined = f"{content}\n\nRefinement applied:\n{additions}"
        context.artifacts["final_content"] = refined
        return "Critic found gaps, so the executor output was refined with explicit improvements."

    def _compose_final_output(self, context: SocietyContext, refinement: str) -> str:
        draft = context.artifacts.get("draft_output", {})
        content = context.artifacts.get("final_content", draft.get("content", "No output produced."))
        critique = context.artifacts.get("critique", {})
        issues = critique.get("issues", [])

        lines = [
            str(content),
            "",
            "Agent review:",
            f"- Refinement: {refinement}",
            f"- Critic status: {'passed' if critique.get('passed') else 'refined'}",
        ]
        if issues:
            lines.append("- Issues found: " + "; ".join(issues))
        return "\n".join(lines)

    def _confidence(self, results: list[AgentResult]) -> float:
        if not results:
            return 0.0
        return round(sum(result.confidence for result in results) / len(results), 2)


def society_run_to_dict(run: SocietyRun) -> dict:
    return asdict(run)

