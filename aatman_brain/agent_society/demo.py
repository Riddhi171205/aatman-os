from __future__ import annotations

from pathlib import Path
import tempfile

from ..config import BrainConfig
from .orchestrator import AgentOrchestrator, society_run_to_dict


def main() -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        orchestrator = AgentOrchestrator(BrainConfig(data_dir=Path(temp_dir)))
        run = orchestrator.run(
            goal="Design a self-evolving agent society for AATMAN OS.",
            session_id="society-demo",
        )
        print(society_run_to_dict(run))
        print(
            orchestrator.add_feedback(
                session_id="society-demo",
                goal=run.goal,
                feedback="Prefer concise outputs with explicit next steps.",
                score=5,
            )
        )


if __name__ == "__main__":
    main()

