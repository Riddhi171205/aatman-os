from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path


@dataclass(frozen=True)
class ExecutionConfig:
    """Execution-layer configuration and safety boundaries."""

    workspace_root: Path = Path(os.getenv("AATMAN_EXECUTION_ROOT", os.getcwd())).resolve()
    data_dir: Path = Path(os.getenv("AATMAN_EXECUTION_DATA_DIR", "aatman_execution/data")).resolve()
    command_timeout_seconds: int = int(os.getenv("AATMAN_COMMAND_TIMEOUT", "20"))
    api_timeout_seconds: int = int(os.getenv("AATMAN_API_TIMEOUT", "15"))
    dry_run_apps: bool = os.getenv("AATMAN_DRY_RUN_APPS", "0") == "1"
    dry_run_communications: bool = os.getenv("AATMAN_DRY_RUN_COMMUNICATIONS", "1") == "1"

    @property
    def history_file(self) -> Path:
        return self.data_dir / "history.jsonl"

    @property
    def schedules_file(self) -> Path:
        return self.data_dir / "scheduled_tasks.json"


def get_config() -> ExecutionConfig:
    config = ExecutionConfig()
    config.data_dir.mkdir(parents=True, exist_ok=True)
    return config

