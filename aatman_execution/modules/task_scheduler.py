from __future__ import annotations

import json
from pathlib import Path
from typing import Any
from uuid import uuid4

from ..schemas import ExecutionResult, fail, now_iso, ok


class TaskSchedulerModule:
    """Basic persistent task scheduler.

    MVP behavior stores tasks for another worker/process to execute later.
    """

    def __init__(self, schedules_file: Path):
        self.schedules_file = schedules_file
        self.schedules_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.schedules_file.exists():
            self.schedules_file.write_text("[]", encoding="utf-8")

    def execute(self, action: dict) -> ExecutionResult:
        operation = str(action.get("action", "")).lower()
        if operation == "schedule":
            return self.schedule(action)
        if operation == "list":
            return ok("schedule", "list", "Scheduled tasks listed.", {"tasks": self._load()})
        if operation == "cancel":
            return self.cancel(str(action.get("id", "")))
        return fail("schedule", operation or "unknown", "Unsupported schedule action.")

    def schedule(self, action: dict) -> ExecutionResult:
        run_at = str(action.get("run_at", ""))
        nested_action = action.get("task") or action.get("payload")
        if not run_at:
            return fail("schedule", "schedule", "run_at is required.")
        if not isinstance(nested_action, dict):
            return fail("schedule", "schedule", "task must be a structured action object.")

        task = {
            "id": str(uuid4()),
            "run_at": run_at,
            "task": nested_action,
            "status": "scheduled",
            "created_at": now_iso(),
        }
        tasks = self._load()
        tasks.append(task)
        self._save(tasks)
        return ok("schedule", "schedule", "Task scheduled.", {"task": task})

    def cancel(self, task_id: str) -> ExecutionResult:
        tasks = self._load()
        for task in tasks:
            if task["id"] == task_id:
                task["status"] = "cancelled"
                self._save(tasks)
                return ok("schedule", "cancel", "Task cancelled.", {"task": task})
        return fail("schedule", "cancel", "Scheduled task not found.", task_id)

    def _load(self) -> list[dict[str, Any]]:
        try:
            return json.loads(self.schedules_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _save(self, tasks: list[dict[str, Any]]) -> None:
        self.schedules_file.write_text(json.dumps(tasks, indent=2), encoding="utf-8")

