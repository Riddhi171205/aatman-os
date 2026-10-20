from __future__ import annotations

from collections import deque

from ..schemas import MemoryRecord, RetrievedMemory


class ShortTermMemory:
    """In-memory rolling buffer for recent conversational context."""

    def __init__(self, max_entries: int = 8):
        self.max_entries = max_entries
        self._by_session: dict[str, deque[MemoryRecord]] = {}

    def store(self, record: MemoryRecord) -> None:
        buffer = self._by_session.setdefault(record.session_id, deque(maxlen=self.max_entries))
        buffer.append(record)

    def recent(self, session_id: str = "default", limit: int | None = None) -> list[MemoryRecord]:
        records = list(self._by_session.get(session_id, []))
        if limit is not None:
            return records[-limit:]
        return records

    def retrieve(self, session_id: str = "default", limit: int | None = None) -> list[RetrievedMemory]:
        records = self.recent(session_id=session_id, limit=limit)
        return [
            RetrievedMemory(record=record, source="short_term", score=1.0 - (index * 0.05))
            for index, record in enumerate(reversed(records))
        ]

    def clear(self, session_id: str | None = None) -> None:
        if session_id is None:
            self._by_session.clear()
            return
        self._by_session.pop(session_id, None)

