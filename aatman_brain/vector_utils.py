from __future__ import annotations

from collections import Counter
import math
import re


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


def tokenize(text: str) -> list[str]:
    return [token.lower() for token in TOKEN_RE.findall(text)]


def embed_text(text: str) -> dict[str, float]:
    """Create a lightweight sparse embedding.

    This is intentionally simple for the MVP. The MemoryEngine and
    KnowledgeEngine can later swap this for Qdrant/FAISS embeddings without
    changing the orchestrator contract.
    """

    tokens = tokenize(text)
    if not tokens:
        return {}

    counts = Counter(tokens)
    total = float(sum(counts.values()))
    return {token: count / total for token, count in counts.items()}


def cosine_similarity(left: dict[str, float], right: dict[str, float]) -> float:
    if not left or not right:
        return 0.0

    shared = set(left) & set(right)
    numerator = sum(left[token] * right[token] for token in shared)
    left_norm = math.sqrt(sum(value * value for value in left.values()))
    right_norm = math.sqrt(sum(value * value for value in right.values()))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return numerator / (left_norm * right_norm)
