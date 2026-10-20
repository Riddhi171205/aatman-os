from dataclasses import dataclass
import os
import sys
from openai import OpenAI


@dataclass(frozen=True)
class LLMConfig:
    """Configuration for LLM client (NVIDIA / OpenAI compatible APIs)."""

    base_url: str = os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1")
    api_key: str | None = os.getenv("NVIDIA_API_KEY")
    model: str = os.getenv("LLM_MODEL", "z-ai/glm-5.1")

    temperature: float = float(os.getenv("LLM_TEMPERATURE", "1"))
    top_p: float = float(os.getenv("LLM_TOP_P", "1"))
    max_tokens: int = int(os.getenv("LLM_MAX_TOKENS", "16384"))

    enable_thinking: bool = os.getenv("LLM_ENABLE_THINKING", "true").lower() == "true"
    timeout_seconds: int = int(os.getenv("LLM_TIMEOUT", "30"))


class LLMClient:
    """Streaming LLM client with reasoning support."""

    def __init__(self, config: LLMConfig):
        self.config = config

        self.client = OpenAI(
            base_url=self.config.base_url,
            api_key=self.config.api_key,
        )

        # Terminal color handling
        self._use_color = sys.stdout.isatty() and os.getenv("NO_COLOR") is None
        self._reasoning_color = "\033[90m" if self._use_color else ""
        self._reset_color = "\033[0m" if self._use_color else ""

    def stream_chat(self, message: str):
        """Stream chat completion with reasoning output."""

        completion = self.client.chat.completions.create(
            model=self.config.model,
            messages=[{"role": "user", "content": message}],
            temperature=self.config.temperature,
            top_p=self.config.top_p,
            max_tokens=self.config.max_tokens,
            stream=True,
            extra_body={
                "chat_template_kwargs": {
                    "enable_thinking": self.config.enable_thinking,
                    "clear_thinking": False,
                }
            },
        )

        for chunk in completion:
            if not getattr(chunk, "choices", None):
                continue

            choice = chunk.choices[0]
            delta = getattr(choice, "delta", None)

            if not delta:
                continue

            # Reasoning output (gray color)
            reasoning = getattr(delta, "reasoning_content", None)
            if reasoning:
                print(f"{self._reasoning_color}{reasoning}{self._reset_color}", end="")

            # Final output
            if getattr(delta, "content", None):
                print(delta.content, end="")


def get_llm_client() -> LLMClient:
    """Factory to initialize client safely."""
    config = LLMConfig()

    if not config.api_key:
        raise ValueError("Missing NVIDIA_API_KEY environment variable")

    return LLMClient(config)


# ---- Usage ----
if __name__ == "__main__":
    client = get_llm_client()
    client.stream_chat("Hello, how are you?")