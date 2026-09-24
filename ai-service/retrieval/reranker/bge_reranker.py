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

        if not self._is_native_loaded or not self._reranker:
            raise RuntimeError("BGE Reranker v2-M3 model is UNAVAILABLE. Heuristic fallback is forbidden in production.")

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
        except Exception as e:
            raise RuntimeError(f"Error during real BGE Reranker scoring: {e}")
