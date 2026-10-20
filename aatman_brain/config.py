from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


def _default_openai_base_url() -> str | None:
    # NVIDIA's API is OpenAI-compatible, so an NVIDIA key alone is enough to use it.
    if os.getenv("OPENAI_BASE_URL"):
        return os.getenv("OPENAI_BASE_URL")
    return NVIDIA_BASE_URL if os.getenv("NVIDIA_API_KEY") else None


@dataclass(frozen=True)
class BrainConfig:
    """Runtime configuration for AATMAN BRAIN, read from the environment.

    LLM providers (AATMAN_LLM_PROVIDER):
    - local (default): deterministic fallbacks, no network
    - ollama: OLLAMA_URL + AATMAN_OLLAMA_MODEL
    - openai: OPENAI_BASE_URL + OPENAI_API_KEY + AATMAN_OPENAI_MODEL
      (NVIDIA_API_KEY works too and defaults the base URL to NVIDIA's endpoint)
    """

    data_dir: Path = field(default_factory=lambda: Path(os.getenv("AATMAN_DATA_DIR", "data")))
    max_context_items: int = field(default_factory=lambda: _env_int("AATMAN_MAX_CONTEXT_ITEMS", 5))

    llm_provider: str = field(default_factory=lambda: os.getenv("AATMAN_LLM_PROVIDER", "local"))
    request_timeout_seconds: int = field(default_factory=lambda: _env_int("AATMAN_LLM_TIMEOUT", 30))

    ollama_url: str = field(default_factory=lambda: os.getenv("OLLAMA_URL", "http://localhost:11434"))
    ollama_model: str = field(default_factory=lambda: os.getenv("AATMAN_OLLAMA_MODEL", "llama3"))

    openai_base_url: str | None = field(default_factory=_default_openai_base_url)
    openai_api_key: str | None = field(
        default_factory=lambda: os.getenv("OPENAI_API_KEY") or os.getenv("NVIDIA_API_KEY")
    )
    openai_model: str = field(default_factory=lambda: os.getenv("AATMAN_OPENAI_MODEL", "z-ai/glm-5.1"))

    @property
    def memory_dir(self) -> Path:
        return self.data_dir / "brain_memory"

    @property
    def knowledge_dir(self) -> Path:
        return self.data_dir / "knowledge"


def get_config() -> BrainConfig:
    return BrainConfig()
