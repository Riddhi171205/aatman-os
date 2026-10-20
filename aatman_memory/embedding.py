from __future__ import annotations

from collections import Counter
import math
import re


TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+")


class SimpleEmbeddingModel:
    """Dependency-free semantic-ish embedding fallback.

    This sparse bag-of-words vector is not as strong as sentence-transformers,
    but it gives the MVP deterministic similarity search and can be replaced by
    FAISS/sentence-transformers behind the same methods later.
    """

    def embed(self, text: str) -> dict[str, float]:
        tokens = [token.lower() for token in TOKEN_RE.findall(text)]
        if not tokens:
            return {}
        counts = Counter(tokens)
        total = float(sum(counts.values()))
        return {token: count / total for token, count in counts.items()}

    def similarity(self, left: dict[str, float], right: dict[str, float]) -> float:
        if not left or not right:
            return 0.0
        shared = set(left) & set(right)
        numerator = sum(left[token] * right[token] for token in shared)
        left_norm = math.sqrt(sum(value * value for value in left.values()))
        right_norm = math.sqrt(sum(value * value for value in right.values()))
        if left_norm == 0 or right_norm == 0:
            return 0.0
        return numerator / (left_norm * right_norm)

