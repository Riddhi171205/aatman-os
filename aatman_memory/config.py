from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path


@dataclass(frozen=True)
class MemoryConfig:
    """Runtime configuration for hybrid memory."""

    data_dir: Path = Path(os.getenv("AATMAN_MEMORY_DATA_DIR", "data/hybrid_memory")).resolve()
    short_term_limit: int = int(os.getenv("AATMAN_SHORT_TERM_LIMIT", "8"))
    default_retrieval_limit: int = int(os.getenv("AATMAN_MEMORY_RETRIEVAL_LIMIT", "6"))

    @property
    def sqlite_path(self) -> Path:
        return self.data_dir / "memory.sqlite3"


def get_config() -> MemoryConfig:
    config = MemoryConfig()
    config.data_dir.mkdir(parents=True, exist_ok=True)
    return config

