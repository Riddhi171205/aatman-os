from __future__ import annotations

from pathlib import Path
import tempfile

from .brain import AatmanBrain, decision_to_dict
from .config import BrainConfig


def main() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        brain = AatmanBrain(BrainConfig(data_dir=Path(temp_dir)))
        run_demo(brain)


def run_demo(brain: AatmanBrain) -> None:
    brain.remember(
        session_id="demo",
        content="The user prefers calm, structured, confident answers.",
        kind="preference",
    )
    brain.ingest_text(
        "aatman_brain_mvp.txt",
        "AATMAN Brain uses reasoning, memory, knowledge retrieval, a world model, and explainability.",
    )
    decision = brain.think("Design a working MVP of the AATMAN Brain core intelligence.", "demo")
    print(decision_to_dict(decision))


if __name__ == "__main__":
    main()
