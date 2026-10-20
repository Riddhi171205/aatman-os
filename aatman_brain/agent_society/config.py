from dataclasses import dataclass
from pathlib import Path


@dataclass
class AgentSocietyConfig:
    # Core paths
    base_dir: Path
    memory_dir: Path
    knowledge_dir: Path

    # Agent settings
    max_iterations: int = 2
    enable_self_improvement: bool = True

    # Performance thresholds
    max_memory_items: int = 100
    error_threshold: int = 5

    # Execution settings
    enable_execution: bool = True
    safe_mode: bool = True

    # Logging
    log_level: str = "INFO"


def get_config() -> AgentSocietyConfig:
    """
    Get the configuration for the Agent Society.
    """

    base_dir = Path.home() / "aatman_data"

    return AgentSocietyConfig(
        base_dir=base_dir,
        memory_dir=base_dir / "memory",
        knowledge_dir=base_dir / "knowledge",

        max_iterations=2,
        enable_self_improvement=True,

        max_memory_items=100,
        error_threshold=5,

        enable_execution=True,
        safe_mode=True,

        log_level="INFO"
    )
