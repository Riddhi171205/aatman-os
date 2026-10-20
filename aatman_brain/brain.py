from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from uuid import uuid4

from .config import BrainConfig, get_config
from .engines.explainability import ExplainabilityEngine
from .engines.knowledge import KnowledgeEngine
from .engines.memory import MemoryEngine
from .engines.reasoning import ReasoningEngine
from .engines.world_model import WorldModel
from .llm_client import LLMClient, bullet_list
from .schemas import BrainDecision, MemoryItem, RetrievedItem


class AatmanBrain:
    """Main orchestrator for AATMAN BRAIN Core Intelligence."""

    def __init__(self, config: BrainConfig | None = None):
        self.config = config or get_config()
        self.config.memory_dir.mkdir(parents=True, exist_ok=True)
        self.config.knowledge_dir.mkdir(parents=True, exist_ok=True)
        self.llm = LLMClient(self.config)
        self.reasoning = ReasoningEngine(self.llm)
        self.memory = MemoryEngine(self.config.memory_dir)
        self.knowledge = KnowledgeEngine(self.config.knowledge_dir)
        self.world_model = WorldModel()
        self.explainability = ExplainabilityEngine()

    def think(self, user_input: str, session_id: str | None = None) -> BrainDecision:
        """Run the full brain flow from input to explainable response."""

        session_id = session_id or str(uuid4())
        intent = self.reasoning.understand_intent(user_input)
        plan = self.reasoning.prioritize(self.reasoning.decompose(intent), intent)

        memory_context = self.memory.retrieve(
            session_id=session_id,
            query=user_input,
            limit=self.config.max_context_items,
        )
        knowledge_context = self.knowledge.retrieve(
            query=user_input,
            limit=self.config.max_context_items,
        )

        context_strings = [item.content for item in memory_context + knowledge_context]
        contradictions = self.reasoning.detect_contradictions(user_input, context_strings)
        simulation = self.world_model.simulate(intent, plan)

        draft_response = self._draft_response(
            user_input=user_input,
            plan=plan,
            memory_context=memory_context,
            knowledge_context=knowledge_context,
            risks=simulation.risks,
        )
        reflection = self.reasoning.reflect(draft_response, contradictions)

        explanation = self.explainability.explain(
            intent=intent,
            plan=plan,
            memory=memory_context,
            knowledge=knowledge_context,
            simulation=simulation,
            contradictions=contradictions,
            reflection=reflection,
        )

        final_response = self._finalize_response(draft_response, contradictions, explanation["confidence"])

        self.memory.remember(
            session_id=session_id,
            content=f"User: {user_input}\nAATMAN: {final_response}",
            kind="conversation",
        )

        return BrainDecision(
            response=final_response,
            intent=intent,
            plan=plan,
            memory_context=memory_context,
            knowledge_context=knowledge_context,
            simulation=simulation,
            explanation=explanation,
            session_id=session_id,
        )

    def remember(self, session_id: str, content: str, kind: str = "fact") -> MemoryItem:
        item = MemoryItem.create(session_id=session_id, content=content, kind=kind)
        self.memory.remember_short_term(item)
        self.memory.remember_long_term(item)
        return item

    def ingest_text(self, name: str, content: str) -> str:
        return str(self.knowledge.ingest_text(name, content))

    def ingest_file(self, path: str) -> str:
        return str(self.knowledge.ingest_file(Path(path)))

    def ingest_url(self, url: str) -> str:
        content = self.knowledge.fetch_url(url)
        path = self.knowledge.ingest_text(f"url_{url.replace('://', '_').replace('/', '_')}.txt", content)
        return str(path)

    def retrieve(self, query: str, session_id: str | None = None) -> dict[str, list[dict]]:
        session_id = session_id or "default"
        return {
            "memory": [asdict(item) for item in self.memory.retrieve(session_id, query)],
            "knowledge": [asdict(item) for item in self.knowledge.retrieve(query)],
        }

    def _draft_response(
        self,
        user_input: str,
        plan: list,
        memory_context: list[RetrievedItem],
        knowledge_context: list[RetrievedItem],
        risks: list[str],
    ) -> str:
        fallback = self._fallback_response(user_input, plan, memory_context, knowledge_context, risks)
        system = (
            "You are AATMAN Brain, the calm core intelligence of an AI-native OS. "
            "Think before answering. Be concise, structured, and confident. "
            "Use retrieved memory and knowledge when relevant."
        )
        user = "\n\n".join(
            [
                f"User goal: {user_input}",
                f"Plan:\n{bullet_list(step.description for step in plan)}",
                f"Memory context:\n{bullet_list(item.content for item in memory_context) or '- none'}",
                f"Knowledge context:\n{bullet_list(item.content for item in knowledge_context) or '- none'}",
                f"Risks:\n{bullet_list(risks)}",
                "Write the final assistant response.",
            ]
        )
        return self.llm.complete(system=system, user=user, fallback=fallback)

    def _fallback_response(
        self,
        user_input: str,
        plan: list,
        memory_context: list[RetrievedItem],
        knowledge_context: list[RetrievedItem],
        risks: list[str],
    ) -> str:
        top_context = memory_context[:2] + knowledge_context[:2]
        lines = [
            "I understand the goal. I’ll approach it as a small plan, then act with context.",
            "",
            "Plan:",
        ]
        lines.extend(f"{index + 1}. {step.description}" for index, step in enumerate(plan))

        if top_context:
            lines.append("")
            lines.append("Relevant context:")
            lines.extend(f"- {item.content[:180]}" for item in top_context)

        lines.append("")
        lines.append("Risk check:")
        lines.extend(f"- {risk}" for risk in risks)
        lines.append("")
        lines.append(f"Recommended next step: start with '{plan[0].description}' and proceed in priority order.")
        return "\n".join(lines)

    def _finalize_response(self, draft: str, contradictions: list[str], confidence: float) -> str:
        if contradictions:
            caution = "I found a possible conflict with prior context, so I’m treating this carefully."
            return f"{caution}\n\n{draft}\n\nConfidence: {confidence:.2f}"
        return f"{draft}\n\nConfidence: {confidence:.2f}"


def decision_to_dict(decision: BrainDecision) -> dict:
    return asdict(decision)
