from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from ..embedding import SimpleEmbeddingModel
from ..schemas import MemoryRecord, RetrievedMemory
from .persistent import PersistentMemory


class SemanticMemory:
    """Semantic retrieval layer.

    MVP implementation stores sparse embedding vectors in SQLite. If FAISS or
    sentence-transformers are introduced later, only this class needs to change.
    """

    def __init__(
        self,
        sqlite_path: Path,
        persistent_memory: PersistentMemory,
        embedding_model: SimpleEmbeddingModel | None = None,
    ):
        self.sqlite_path = sqlite_path
        self.persistent_memory = persistent_memory
        self.embedding_model = embedding_model or SimpleEmbeddingModel()
        self._init_db()

    def store(self, record: MemoryRecord) -> None:
        vector = self.embedding_model.embed(record.text())
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO semantic_vectors (memory_id, vector_json, updated_at)
                VALUES (?, ?, ?)
                """,
                (record.id, json.dumps(vector), record.timestamp),
            )

    def search(
        self,
        query: str,
        session_id: str | None = None,
        tags: list[str] | None = None,
        limit: int = 6,
    ) -> list[RetrievedMemory]:
        query_vector = self.embedding_model.embed(query)
        tag_set = {tag.lower() for tag in tags or []}
        results: list[RetrievedMemory] = []

        with self._connect() as conn:
            rows = conn.execute("SELECT memory_id, vector_json FROM semantic_vectors").fetchall()

        for row in rows:
            record = self.persistent_memory.get(row["memory_id"])
            if not record:
                continue
            if session_id and record.session_id != session_id:
                continue
            if tag_set and not (tag_set & {tag.lower() for tag in record.tags}):
                continue

            vector = json.loads(row["vector_json"] or "{}")
            semantic_score = self.embedding_model.similarity(query_vector, vector)
            weighted_score = semantic_score + (record.importance * 0.08)
            if weighted_score > 0:
                results.append(RetrievedMemory(record=record, source="semantic", score=weighted_score))

        return sorted(results, key=lambda item: item.score, reverse=True)[:limit]

    def rebuild(self) -> int:
        count = 0
        with self._connect() as conn:
            conn.execute("DELETE FROM semantic_vectors")
        for record in self.persistent_memory.all():
            self.store(record)
            count += 1
        return count

    def _init_db(self) -> None:
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS semantic_vectors (
                    memory_id TEXT PRIMARY KEY,
                    vector_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

