from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Iterable

from ..schemas import MemoryRecord


class PersistentMemory:
    """SQLite-backed long-term memory for all interactions."""

    def __init__(self, sqlite_path: Path):
        self.sqlite_path = sqlite_path
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def store(self, record: MemoryRecord) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO memories (
                    id, session_id, input, plan, action_json, result,
                    tags_json, importance, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.id,
                    record.session_id,
                    record.input,
                    record.plan,
                    json.dumps(record.action, ensure_ascii=False),
                    record.result,
                    json.dumps(record.tags, ensure_ascii=False),
                    record.importance,
                    record.timestamp,
                ),
            )

    def get(self, memory_id: str) -> MemoryRecord | None:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM memories WHERE id = ?", (memory_id,)).fetchone()
        return self._row_to_record(row) if row else None

    def list_recent(self, session_id: str | None = None, limit: int = 20) -> list[MemoryRecord]:
        query = "SELECT * FROM memories"
        params: tuple = ()
        if session_id:
            query += " WHERE session_id = ?"
            params = (session_id,)
        query += " ORDER BY timestamp DESC LIMIT ?"
        params = (*params, limit)
        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()
        return [self._row_to_record(row) for row in rows]

    def all(self) -> Iterable[MemoryRecord]:
        with self._connect() as conn:
            rows = conn.execute("SELECT * FROM memories ORDER BY timestamp ASC").fetchall()
        return [self._row_to_record(row) for row in rows]

    def find_by_tags(self, tags: list[str], limit: int = 20) -> list[MemoryRecord]:
        if not tags:
            return []
        tag_set = {tag.lower() for tag in tags}
        matches: list[MemoryRecord] = []
        for record in self.all():
            if tag_set & {tag.lower() for tag in record.tags}:
                matches.append(record)
            if len(matches) >= limit:
                break
        return matches

    def cleanup_low_importance(self, threshold: float = 0.15) -> int:
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM memories WHERE importance < ?", (threshold,))
            return cursor.rowcount

    def _init_db(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS memories (
                    id TEXT PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    input TEXT NOT NULL,
                    plan TEXT,
                    action_json TEXT,
                    result TEXT,
                    tags_json TEXT,
                    importance REAL,
                    timestamp TEXT NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp)")

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _row_to_record(self, row: sqlite3.Row) -> MemoryRecord:
        return MemoryRecord(
            id=row["id"],
            session_id=row["session_id"],
            input=row["input"],
            plan=row["plan"] or "",
            action=json.loads(row["action_json"] or "{}"),
            result=row["result"] or "",
            tags=json.loads(row["tags_json"] or "[]"),
            importance=float(row["importance"] or 0.5),
            timestamp=row["timestamp"],
        )

