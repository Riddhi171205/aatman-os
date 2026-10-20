from __future__ import annotations

import json
from pathlib import Path
import tempfile

from .config import ExecutionConfig
from .controller import ExecutionController


def main() -> None:
    """Run a safe local demonstration of the execution layer."""

    with tempfile.TemporaryDirectory() as workspace:
        config = ExecutionConfig(
            workspace_root=Path(workspace),
            data_dir=Path(workspace) / ".aatman_execution",
            dry_run_apps=True,
            dry_run_communications=True,
        )
        controller = ExecutionController(config)

        actions = [
            {"type": "file", "action": "write", "path": "notes.txt", "content": "AATMAN execution layer online."},
            {"type": "file", "action": "read", "path": "notes.txt"},
            {"type": "command", "cmd": "pwd"},
            {"type": "app", "action": "open", "name": "chrome"},
            {"type": "communication", "action": "email", "to": "user@example.com", "subject": "AATMAN", "body": "Execution complete."},
            {
                "type": "schedule",
                "action": "schedule",
                "run_at": "2026-05-17T18:00:00+05:30",
                "task": {"type": "communication", "action": "notify", "message": "Review AATMAN OS."},
            },
        ]

        output = controller.execute_many(actions)
        print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()

