from __future__ import annotations

import json
from typing import Iterable
from urllib import error, request

from .config import BrainConfig


class LLMClient:
    """Small LLM adapter with graceful local fallback.

    Supported modes:
    - AATMAN_LLM_PROVIDER=ollama
    - AATMAN_LLM_PROVIDER=openai with OPENAI_BASE_URL + OPENAI_API_KEY
    - local fallback when no provider is configured or a call fails
    """

    def __init__(self, config: BrainConfig):
        self.config = config

    def complete(self, system: str, user: str, fallback: str) -> str:
        provider = self.config.llm_provider.lower().strip()
        if provider == "ollama":
            return self._ollama_complete(system, user, fallback)
        if provider == "openai":
            return self._openai_complete(system, user, fallback)
        return fallback

    def _post_json(self, url: str, payload: dict, headers: dict[str, str] | None = None) -> dict:
        body = json.dumps(payload).encode("utf-8")
        req = request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json", **(headers or {})},
            method="POST",
        )
        with request.urlopen(req, timeout=self.config.request_timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))

    def _ollama_complete(self, system: str, user: str, fallback: str) -> str:
        try:
            data = self._post_json(
                f"{self.config.ollama_url.rstrip('/')}/api/chat",
                {
                    "model": self.config.ollama_model,
                    "stream": False,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
            )
            return data.get("message", {}).get("content", "").strip() or fallback
        except (error.URLError, TimeoutError, json.JSONDecodeError, KeyError):
            return fallback

    def _openai_complete(self, system: str, user: str, fallback: str) -> str:
        if not self.config.openai_base_url or not self.config.openai_api_key:
            return fallback

        try:
            data = self._post_json(
                f"{self.config.openai_base_url.rstrip('/')}/chat/completions",
                {
                    "model": self.config.openai_model,
                    "temperature": 0.2,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                },
                {"Authorization": f"Bearer {self.config.openai_api_key}"},
            )
            return data["choices"][0]["message"]["content"].strip() or fallback
        except (error.URLError, TimeoutError, json.JSONDecodeError, KeyError, IndexError):
            return fallback


def bullet_list(items: Iterable[str]) -> str:
    return "\n".join(f"- {item}" for item in items)

