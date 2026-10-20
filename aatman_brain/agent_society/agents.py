from __future__ import annotations

from typing import Any

from .base import BaseAgent
from .schemas import AgentTask, SocietyContext


class PlannerAgent(BaseAgent):
    name = "planner"
    role = "Break user goals into structured, prioritized tasks."

    def run(self, context: SocietyContext):
        tasks = self._build_tasks(context.goal, context.task_type)
        context.artifacts["plan"] = tasks
        context.add_message(
            "planner",
            "researcher",
            "Here is the ordered task plan. Use it to gather only relevant context.",
            task_count=len(tasks),
        )
        summary = f"Created {len(tasks)} prioritized task(s) for the goal."
        return self.result(summary, {"tasks": [task.__dict__ for task in tasks]}, 0.76, context)

    def _build_tasks(self, goal: str, task_type: str) -> list[AgentTask]:
        if task_type == "implementation":
            descriptions = [
                f"Define the expected implementation outcome for: {goal}",
                "Inspect existing architecture and constraints",
                "Implement the smallest useful working version",
                "Verify behavior with a focused smoke test",
                "Summarize changes and next improvements",
            ]
        elif task_type == "research":
            descriptions = [
                f"Clarify the research question for: {goal}",
                "Collect relevant internal and external context",
                "Compare findings and identify uncertainty",
                "Synthesize a practical recommendation",
            ]
        elif task_type == "action":
            descriptions = [
                f"Confirm the requested action for: {goal}",
                "Check safety, permissions, and context",
                "Execute or prepare the action",
                "Report the result clearly",
            ]
        else:
            descriptions = [
                f"Understand the goal: {goal}",
                "Collect useful context",
                "Produce the best answer or plan",
                "Review for gaps and refine",
            ]

        return [
            AgentTask.create(description=description, priority=index + 1)
            for index, description in enumerate(descriptions)
        ]


class ResearchAgent(BaseAgent):
    name = "researcher"
    role = "Gather relevant context, assumptions, and evidence for the team."

    def run(self, context: SocietyContext):
        plan: list[AgentTask] = context.artifacts.get("plan", [])
        insights = self._collect_insights(context, plan)
        context.artifacts["research"] = insights
        context.add_message(
            "researcher",
            "executor",
            "Research context is ready. Use these insights to produce the working output.",
            insight_count=len(insights),
        )
        summary = f"Collected {len(insights)} research insight(s)."
        return self.result(summary, {"insights": insights}, 0.7, context)

    def _collect_insights(self, context: SocietyContext, plan: list[AgentTask]) -> list[str]:
        insights = [
            "Keep the MVP modular so each agent can evolve independently.",
            "Use shared context artifacts rather than hidden global state.",
            "Persist feedback as guidance so future runs can adapt.",
        ]
        if context.shared_memory:
            insights.append(f"Apply learned guidance: {context.shared_memory[0]}")
        if plan:
            insights.append(f"The highest-priority task is: {plan[0].description}")
        if context.task_type == "implementation":
            insights.append("Prefer a small working implementation with smoke tests over a large speculative design.")
        if context.task_type == "research":
            insights.append("Mark uncertainty explicitly when evidence is incomplete.")
        return insights


class ExecutorAgent(BaseAgent):
    name = "executor"
    role = "Produce the answer, code strategy, or action result using team context."

    def run(self, context: SocietyContext):
        plan: list[AgentTask] = context.artifacts.get("plan", [])
        insights: list[str] = context.artifacts.get("research", [])
        output = self._execute(context.goal, context.task_type, plan, insights)
        context.artifacts["draft_output"] = output
        context.add_message(
            "executor",
            "critic",
            "Draft output is ready. Please review for correctness, gaps, and refinements.",
        )
        return self.result("Produced a draft output from the plan and research.", output, 0.72, context)

    def _execute(
        self,
        goal: str,
        task_type: str,
        plan: list[AgentTask],
        insights: list[str],
    ) -> dict[str, Any]:
        lines = [
            "AATMAN Agent Society response:",
            f"Goal: {goal}",
            "",
            "Working plan:",
        ]
        lines.extend(f"{index + 1}. {task.description}" for index, task in enumerate(plan))

        if insights:
            lines.append("")
            lines.append("Context used:")
            lines.extend(f"- {insight}" for insight in insights[:5])

        if task_type == "implementation":
            recommendation = "Build the smallest end-to-end slice, verify it, then evolve agents based on feedback."
        elif task_type == "research":
            recommendation = "Use the research findings to decide the next action, then validate assumptions."
        elif task_type == "action":
            recommendation = "Confirm safety and permissions before executing the requested action."
        else:
            recommendation = "Proceed through the plan, keeping the final answer concise and explainable."

        lines.append("")
        lines.append(f"Recommended execution: {recommendation}")
        return {
            "content": "\n".join(lines),
            "recommendation": recommendation,
            "completed_task_ids": [task.id for task in plan[: max(1, min(3, len(plan)))]],
        }


class CriticAgent(BaseAgent):
    name = "critic"
    role = "Review outputs, detect gaps, and suggest improvements."

    def run(self, context: SocietyContext):
        draft: dict[str, Any] = context.artifacts.get("draft_output", {})
        plan: list[AgentTask] = context.artifacts.get("plan", [])
        critique = self._critique(draft, plan)
        context.artifacts["critique"] = critique
        context.add_message(
            "critic",
            "executor",
            "Review complete. Apply the improvements before final output.",
            passed=critique["passed"],
        )
        summary = "Draft passed review." if critique["passed"] else "Draft needs refinement."
        return self.result(summary, critique, critique["confidence"], context)

    def _critique(self, draft: dict[str, Any], plan: list[AgentTask]) -> dict[str, Any]:
        content = str(draft.get("content", ""))
        issues: list[str] = []
        improvements: list[str] = []

        if len(content.strip()) < 120:
            issues.append("Draft is too short to be useful.")
            improvements.append("Add concrete steps and context.")
        if "Recommended execution:" not in content:
            issues.append("Draft does not provide a clear recommended execution.")
            improvements.append("Add one decisive next step.")
        if plan and not all(task.description in content for task in plan[:2]):
            issues.append("Draft does not reflect the highest-priority plan steps.")
            improvements.append("Include the top-priority plan steps in the final output.")

        passed = not issues
        confidence = 0.82 if passed else 0.58
        if not improvements:
            improvements.append("Keep the response calm, structured, and concise.")

        return {
            "passed": passed,
            "issues": issues,
            "improvements": improvements,
            "confidence": confidence,
        }

