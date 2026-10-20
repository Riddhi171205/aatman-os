from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..vector_utils import cosine_similarity, embed_text


class AgentSocietyMemory:
    """Simple persistent memory for runs, feedback, and learned guidance."""

    def __init__(self, data_dir: Path):
        self.memory_dir = data_dir / "agent_society"
        self.memory_dir.mkdir(parents=True, exist_ok=True)
        self.runs_file = self.memory_dir / "runs.jsonl"
        self.feedback_file = self.memory_dir / "feedback.jsonl"
        self.learned_file = self.memory_dir / "learned.jsonl"
        for path in [self.runs_file, self.feedback_file, self.learned_file]:
            path.touch(exist_ok=True)

    def store_run(self, run: dict[str, Any]) -> None:
        self._append(self.runs_file, run)

    def store_feedback(self, session_id: str, goal: str, feedback: str, score: int | None = None) -> dict[str, Any]:
        record = {
            "session_id": session_id,
            "goal": goal,
            "feedback": feedback,
            "score": score,
        }
        self._append(self.feedback_file, record)

        learned = self._derive_learning(feedback, score)
        if learned:
            self._append(self.learned_file, {"guidance": learned, "source": "feedback", "session_id": session_id})
            record["learned"] = learned
        return record

    def retrieve_guidance(self, query: str, limit: int = 5) -> list[str]:
        query_vector = embed_text(query)
        ranked: list[tuple[float, str]] = []
        for record in self._read_jsonl(self.learned_file):
            guidance = str(record.get("guidance", ""))
            score = cosine_similarity(query_vector, embed_text(guidance))
            if score > 0:
                ranked.append((score, guidance))
        return [guidance for _, guidance in sorted(ranked, reverse=True)[:limit]]

    def recent_feedback(self, limit: int = 5) -> list[dict[str, Any]]:
        return self._read_jsonl(self.feedback_file)[-limit:]

    def _append(self, path: Path, record: dict[str, Any]) -> None:
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")

    def _read_jsonl(self, path: Path) -> list[dict[str, Any]]:
        records: list[dict[str, Any]] = []
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                if not line.strip():
                    continue
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return records

    def _derive_learning(self, feedback: str, score: int | None) -> str | None:
        cleaned = " ".join(feedback.split())
        if not cleaned:
            return None
        if score is not None and score >= 4:
            return f"Continue this behavior: {cleaned}"
        if score is not None and score <= 2:
            return f"Improve next time: {cleaned}"
        if any(word in cleaned.lower() for word in ["more", "less", "prefer", "avoid", "improve"]):
            return f"User guidance: {cleaned}"
        return None

