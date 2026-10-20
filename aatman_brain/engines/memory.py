from __future__ import annotations

import json
from pathlib import Path

from ..schemas import MemoryItem, RetrievedItem
from ..vector_utils import cosine_similarity, embed_text
from .base import BaseEngine


class MemoryEngine(BaseEngine):
    """Short-term and long-term memory over a simple JSONL store."""

    def __init__(self, memory_dir: Path):
        super().__init__("MemoryEngine")
        self.memory_dir = memory_dir
        self.short_term: dict[str, list[MemoryItem]] = {}
        self.memory_file = self.memory_dir / "long_term.jsonl"
        self.memory_file.touch(exist_ok=True)
        self.log(f"Initialized MemoryEngine with store at {self.memory_file}")

    def remember_short_term(self, item: MemoryItem) -> None:
        self.short_term.setdefault(item.session_id, []).append(item)
        self.short_term[item.session_id] = self.short_term[item.session_id][-20:]

    def remember_long_term(self, item: MemoryItem) -> None:
        try:
            with self.memory_file.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(item.__dict__, ensure_ascii=False) + "\n")
            self.log(f"Persisted long-term memory for session {item.session_id}", "debug")
        except Exception as e:
            self.log(f"Failed to persist long-term memory: {e}", "error")

    def remember(self, session_id: str, content: str, kind: str = "conversation") -> MemoryItem:
        self.log(f"Storing new memory item [kind: {kind}]", "info")
        item = MemoryItem.create(session_id=session_id, content=content, kind=kind)
        self.remember_short_term(item)
        if self._should_persist(content):
            self.remember_long_term(item)
        return item

    def retrieve(self, session_id: str, query: str, limit: int = 6) -> list[RetrievedItem]:
        self.log(f"Retrieving memories for query: {query}", "debug")
        query_vector = embed_text(query)
        candidates: list[tuple[MemoryItem, str]] = []
        seen_ids: set[str] = set()

        for item in self.short_term.get(session_id, []):
            candidates.append((item, "short_term"))
            seen_ids.add(item.id)

        for item in self._iter_long_term():
            if item.id in seen_ids:
                continue
            candidates.append((item, "long_term"))

        ranked: list[RetrievedItem] = []
        for item, source in candidates:
            score = cosine_similarity(query_vector, embed_text(item.content))
            if score > 0:
                ranked.append(
                    RetrievedItem(
                        source=source,
                        content=item.content,
                        score=score,
                        metadata={"id": item.id, "kind": item.kind, "created_at": item.created_at},
                    )
                )

        results = sorted(ranked, key=lambda item: item.score, reverse=True)[:limit]
        self.log(f"Retrieved {len(results)} memory items.")
        return results

    def _iter_long_term(self) -> list[MemoryItem]:
        items: list[MemoryItem] = []
        with self.memory_file.open("r", encoding="utf-8") as handle:
            for line in handle:
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                    items.append(MemoryItem(**data))
                except (json.JSONDecodeError, TypeError):
                    continue
        return items

    def _should_persist(self, content: str) -> bool:
        lower = content.lower()
        memory_signals = ["remember", "prefer", "my name", "i like", "important", "project", "goal"]
        return any(signal in lower for signal in memory_signals) or len(content.split()) >= 18
