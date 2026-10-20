from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

from ..schemas import MemoryRecord, now_iso


class EpisodicMemory:
    """Full interaction log: input, plan, action, and result/output."""

    def __init__(self, sqlite_path: Path):
        self.sqlite_path = sqlite_path
        self._init_db()

    def log(self, record: MemoryRecord, reasoning: dict[str, Any] | None = None) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO episodes (
                    id, memory_id, session_id, input, plan, action_json,
                    result, reasoning_json, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    f"episode-{record.id}",
                    record.id,
                    record.session_id,
                    record.input,
                    record.plan,
                    json.dumps(record.action, ensure_ascii=False),
                    record.result,
                    json.dumps(reasoning or {}, ensure_ascii=False),
                    record.timestamp or now_iso(),
                ),
            )

    def recent(self, session_id: str | None = None, limit: int = 20) -> list[dict[str, Any]]:
        query = "SELECT * FROM episodes"
        params: tuple = ()
        if session_id:
            query += " WHERE session_id = ?"
            params = (session_id,)
        query += " ORDER BY timestamp DESC LIMIT ?"
        params = (*params, limit)
        with self._connect() as conn:
            rows = conn.execute(query, params).fetchall()
        return [self._row_to_dict(row) for row in rows]

    def _init_db(self) -> None:
        self.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS episodes (
                    id TEXT PRIMARY KEY,
                    memory_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    input TEXT NOT NULL,
                    plan TEXT,
                    action_json TEXT,
                    result TEXT,
                    reasoning_json TEXT,
                    timestamp TEXT NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_episodes_session ON episodes(session_id)")

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.sqlite_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _row_to_dict(self, row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "memory_id": row["memory_id"],
            "session_id": row["session_id"],
            "input": row["input"],
            "plan": row["plan"] or "",
            "action": json.loads(row["action_json"] or "{}"),
            "result": row["result"] or "",
            "reasoning": json.loads(row["reasoning_json"] or "{}"),
            "timestamp": row["timestamp"],
        }

