from __future__ import annotations

from typing import Any

from .config import MemoryConfig, get_config
from .schemas import MemoryRecord, RetrievedMemory
from .storage.episodic import EpisodicMemory
from .storage.persistent import PersistentMemory
from .storage.semantic import SemanticMemory
from .storage.short_term import ShortTermMemory


class MemoryManager:
    """Core controller for AATMAN hybrid memory.

    Stores interactions across:
    - Short-term memory for immediate conversational context
    - Persistent memory for long-term recall
    - Semantic memory for meaning-based retrieval
    - Episodic memory for full interaction logs
    """

    def __init__(self, config: MemoryConfig | None = None):
        self.config = config or get_config()
        self.config.data_dir.mkdir(parents=True, exist_ok=True)
        self.short_term = ShortTermMemory(max_entries=self.config.short_term_limit)
        self.persistent = PersistentMemory(self.config.sqlite_path)
        self.episodic = EpisodicMemory(self.config.sqlite_path)
        self.semantic = SemanticMemory(self.config.sqlite_path, self.persistent)

    def store_interaction(
        self,
        input: str,
        plan: str = "",
        action: dict[str, Any] | None = None,
        result: str = "",
        session_id: str = "default",
        tags: list[str] | None = None,
        importance: float | None = None,
        reasoning: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Store a complete interaction in every memory layer."""

        record = MemoryRecord(
            input=input,
            plan=plan,
            action=action or {},
            result=result,
            session_id=session_id,
            tags=tags or self._infer_tags(input, plan, result),
            importance=self._score_importance(input, result, importance),
        )
        self.short_term.store(record)
        self.persistent.store(record)
        self.semantic.store(record)
        self.episodic.log(record, reasoning=reasoning)
        return record.to_dict()

    def retrieve_context(
        self,
        query: str,
        session_id: str = "default",
        limit: int | None = None,
        tags: list[str] | None = None,
    ) -> dict[str, Any]:
        """Return compact context for reasoning engines."""

        limit = limit or self.config.default_retrieval_limit
        recent = self.short_term.retrieve(session_id=session_id, limit=min(5, limit))
        semantic = self.semantic.search(query=query, session_id=None, tags=tags, limit=limit)
        merged = self._merge_results([*recent, *semantic], limit=limit)

        return {
            "query": query,
            "session_id": session_id,
            "recent": [item.to_dict() for item in recent],
            "relevant": [item.to_dict() for item in semantic],
            "context": [item.to_dict() for item in merged],
            "summary": self._summarize_context(merged),
        }

    def recent_episodes(self, session_id: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
        return self.episodic.recent(session_id=session_id, limit=limit)

    def retrieve_by_tags(self, tags: list[str], limit: int = 20) -> list[dict[str, Any]]:
        return [record.to_dict() for record in self.persistent.find_by_tags(tags=tags, limit=limit)]

    def rebuild_semantic_index(self) -> dict[str, int]:
        return {"indexed": self.semantic.rebuild()}

    def cleanup(self, importance_threshold: float = 0.15) -> dict[str, int]:
        deleted = self.persistent.cleanup_low_importance(importance_threshold)
        indexed = self.semantic.rebuild()
        return {"deleted": deleted, "indexed": indexed}

    def _merge_results(self, results: list[RetrievedMemory], limit: int) -> list[RetrievedMemory]:
        by_id: dict[str, RetrievedMemory] = {}
        for item in results:
            existing = by_id.get(item.record.id)
            if not existing or item.score > existing.score:
                by_id[item.record.id] = item
        return sorted(by_id.values(), key=lambda item: item.score, reverse=True)[:limit]

    def _summarize_context(self, memories: list[RetrievedMemory]) -> str:
        if not memories:
            return "No relevant memory found."
        lines = []
        for item in memories[:5]:
            record = item.record
            lines.append(
                f"- [{item.source} {item.score:.2f}] User said: {record.input}; result: {record.result or 'n/a'}"
            )
        return "\n".join(lines)

    def _infer_tags(self, input: str, plan: str, result: str) -> list[str]:
        text = f"{input} {plan} {result}".lower()
        tags: list[str] = []
        tag_signals = {
            "preference": ["prefer", "like", "avoid", "always", "never"],
            "execution": ["open", "run", "execute", "command", "action"],
            "planning": ["plan", "design", "build", "create"],
            "research": ["research", "compare", "summarize", "find"],
            "error": ["error", "failed", "bug", "issue"],
        }
        for tag, signals in tag_signals.items():
            if any(signal in text for signal in signals):
                tags.append(tag)
        return tags or ["interaction"]

    def _score_importance(self, input: str, result: str, explicit: float | None) -> float:
        if explicit is not None:
            return max(0.0, min(float(explicit), 1.0))

        text = f"{input} {result}".lower()
        score = 0.45
        if any(signal in text for signal in ["remember", "prefer", "important", "always", "never"]):
            score += 0.25
        if any(signal in text for signal in ["failed", "error", "bug", "success"]):
            score += 0.15
        if len(text.split()) > 20:
            score += 0.1
        return max(0.0, min(score, 1.0))

