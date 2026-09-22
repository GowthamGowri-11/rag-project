import hashlib
from typing import Any


class ContextOptimizer:
    """Optimizes retrieved candidate chunks before evidence gating.
    Deduplicates text, filters weak scores, preserves source metadata, and organizes context.
    """

    def __init__(self, min_score_threshold: float = 0.25, max_context_chars: int = 8000):
        self.min_score_threshold = min_score_threshold
        self.max_context_chars = max_context_chars

    def optimize(self, chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not chunks:
            return []

        seen_hashes = set()
        optimized = []
        accumulated_chars = 0

        # Sort primarily by rerank_score (if available), then retrieval_score
        sorted_chunks = sorted(
            chunks,
            key=lambda x: x.get("rerank_score", x.get("retrieval_score", 0)),
            reverse=True
        )

        for c in sorted_chunks:
            score = c.get("rerank_score", c.get("retrieval_score", 0))
            if score < self.min_score_threshold:
                continue

            # Deduplication by content hash
            text = c.get("text", "").strip()
            text_hash = hashlib.md5(text.encode('utf-8')).hexdigest()
            if text_hash in seen_hashes:
                continue
            seen_hashes.add(text_hash)

            # Check context budget
            if accumulated_chars + len(text) > self.max_context_chars:
                break

            accumulated_chars += len(text)
            optimized.append(c)

        return optimized
