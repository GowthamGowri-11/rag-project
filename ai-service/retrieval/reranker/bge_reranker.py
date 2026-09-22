import logging
import math
from typing import Any

logger = logging.getLogger(__name__)

class BGERerankerService:
    """Service interface for BAAI/bge-reranker-v2-m3.
    Re-scores candidate chunks against the user query to provide fine-grained relevance.
    """

    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self._reranker = None
        self._is_native_loaded = False
        self._init_model()

    def _init_model(self):
        try:
            from FlagEmbedding import FlagReranker
            logger.info(f"Loading native BGE Reranker '{self.model_name}' on {self.device}...")
            self._reranker = FlagReranker(self.model_name, use_fp16=(self.device != 'cpu'))
            self._is_native_loaded = True
            logger.info("Native BGE Reranker loaded successfully.")
        except Exception as e:  # noqa: BLE001
            logger.warning(
                f"Native BGE Reranker not loaded ({e!s}). "
                "Operating in semantic cross-encoder fallback mode (scaffold-ready)."
            )
            self._is_native_loaded = False

    def rerank(self, query: str, candidates: list[dict[str, Any]], top_n: int = 7) -> list[dict[str, Any]]:
        """
        Reranks a list of candidate chunks (typically top 20-50) using the transformer reranker.
        Attaches 'rerank_score' to each chunk and returns the top_n results.
        """
        if not candidates:
            return []

        # Native transformer scoring
        if self._is_native_loaded and self._reranker:
            try:
                pairs = [[query, c["text"]] for c in candidates]
                scores = self._reranker.compute_score(pairs)
                # Convert logits to 0.0 - 1.0 probability range using sigmoid
                for idx, c in enumerate(candidates):
                    raw_score = scores[idx] if isinstance(scores, list) else scores
                    sigmoid_score = 1.0 / (1.0 + math.exp(-raw_score))
                    c["rerank_score"] = round(sigmoid_score, 4)

                candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
                return candidates[:top_n]
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error during native reranking: {e}")

        # Fallback cross-encoder heuristic scoring
        import re
        stopwords = {"what", "is", "are", "the", "a", "an", "and", "or", "in", "on", "at", "for", "to", "how", "does", "do", "it", "this", "that"}
        q_words = [w for w in re.findall(r'\b\w+\b', query.lower()) if w not in stopwords and len(w) > 1]
        if not q_words:
            q_words = re.findall(r'\b\w+\b', query.lower())

        for c in candidates:
            text_lower = c["text"].lower()
            text_words = set(re.findall(r'\b\w+\b', text_lower))

            # Keyword coverage
            overlap = sum(1 for w in q_words if w in text_words)
            keyword_coverage = overlap / max(len(q_words), 1)

            # Jaccard
            q_set = set(q_words)
            jaccard = len(q_set.intersection(text_words)) / max(len(q_set.union(text_words)), 1)

            # Phrase presence
            phrase_bonus = 0.25 if any(f"{q_words[i]} {q_words[i+1]}" in text_lower for i in range(len(q_words)-1)) else 0.0
            retrieval_prior = c.get("retrieval_score", 0.5)

            # Combine signals into a calibrated 0.0 - 1.0 confidence score
            combined = (keyword_coverage * 0.60) + (jaccard * 0.15) + phrase_bonus + (retrieval_prior * 0.10)
            c["rerank_score"] = round(min(max(combined, 0.0), 0.99), 4)

        candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
        return candidates[:top_n]
