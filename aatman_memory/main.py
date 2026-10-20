from __future__ import annotations

import json
from pathlib import Path
import tempfile

from .config import MemoryConfig
from .manager import MemoryManager


def main() -> None:
    """Run a small persistence and retrieval demonstration."""

    with tempfile.TemporaryDirectory() as temp_dir:
        config = MemoryConfig(data_dir=Path(temp_dir), short_term_limit=5)
        memory = MemoryManager(config)

        memory.store_interaction(
            input="I prefer calm, structured responses with explicit next steps.",
            plan="Store user preference",
            action={"type": "memory", "action": "store"},
            result="Preference saved",
            session_id="demo",
            tags=["preference"],
            importance=0.9,
        )
        memory.store_interaction(
            input="Open Chrome and fetch weather data",
            plan="Open browser, call weather API, return result",
            action={"type": "app", "action": "open", "name": "chrome"},
            result="Chrome opened; weather API returned sample data",
            session_id="demo",
            tags=["execution", "weather"],
            importance=0.7,
        )

        context = memory.retrieve_context("How should I answer weather workflow requests?", session_id="demo")
        print(json.dumps(context, indent=2))

        restarted = MemoryManager(config)
        restored = restarted.retrieve_context("weather API browser", session_id="demo")
        print(json.dumps({"after_restart": restored["summary"]}, indent=2))


if __name__ == "__main__":
    main()

