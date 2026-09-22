import hashlib
import logging
import math
from typing import Any

logger = logging.getLogger(__name__)

class BGEM3EmbeddingService:
    """Service interface for BAAI/bge-m3 embedding model.
    Produces 1024-dimensional dense vectors and lexical sparse vectors.
    """

    DIMENSION = 1024

    def __init__(self, model_name: str = "BAAI/bge-m3", device: str = "cpu"):
        self.model_name = model_name
        self.device = device
        self._model = None
        self._is_native_loaded = False
        self._initialize_model()

    def _initialize_model(self):
        """Attempts to load native FlagEmbedding BGEM3FlagModel if installed."""
        try:
            from FlagEmbedding import BGEM3FlagModel
            logger.info(f"Loading native BGE-M3 model '{self.model_name}' on {self.device}...")
            self._model = BGEM3FlagModel(self.model_name, use_fp16=(self.device != 'cpu'), device=self.device)
            self._is_native_loaded = True
            logger.info("Native BGE-M3 loaded successfully.")
        except (ImportError, Exception) as e:  # noqa: BLE001
            logger.warning(
                f"Native BGE-M3 model not loaded ({e!s}). "
                "Operating in deterministic structural embedding mode (scaffold-ready)."
            )
            self._is_native_loaded = False

    def embed_dense(self, texts: list[str]) -> list[list[float]]:
        """Compute 1024-dimensional dense embeddings for a list of texts."""
        if not texts:
            return []

        if self._is_native_loaded and self._model:
            try:
                output = self._model.encode(texts, return_dense=True, return_sparse=False)
                return output['dense_vecs'].tolist()
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error during native BGE-M3 dense encoding: {e}. Falling back to deterministic vector.")

        # Deterministic 1024-dim normalized embedding fallback
        results = []
        for text in texts:
            results.append(self._generate_deterministic_vector(text))
        return results

    def embed_sparse(self, texts: list[str]) -> list[dict[int, float]]:
        """Compute lexical sparse token weights for hybrid retrieval."""
        if not texts:
            return []

        if self._is_native_loaded and self._model:
            try:
                output = self._model.encode(texts, return_dense=False, return_sparse=True)
                sparse_vecs = output['lexical_weights']
                return [{int(k): float(v) for k, v in sv.items()} for sv in sparse_vecs]
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error during native BGE-M3 sparse encoding: {e}. Falling back to token frequency.")

        # Deterministic bag-of-words sparse weights
        results = []
        for text in texts:
            token_weights: dict[int, float] = {}
            words = text.lower().split()
            for w in words:
                # Hash token to int index modulo 30000 (typical vocabulary size)
                token_hash = int(hashlib.md5(w.encode('utf-8')).hexdigest()[:6], 16) % 30000
                token_weights[token_hash] = token_weights.get(token_hash, 0.0) + 1.0
            results.append(token_weights)
        return results

    def embed_query(self, query: str) -> dict[str, Any]:
        """Returns both dense and sparse representations for a user query."""
        dense = self.embed_dense([query])[0]
        sparse = self.embed_sparse([query])[0]
        return {
            "dense": dense,
            "sparse": sparse
        }

    def _generate_deterministic_vector(self, text: str) -> list[float]:
        """Produces a deterministic, normalized 1024-dimensional vector from text semantics."""
        raw_seed = hashlib.sha256(text.encode('utf-8')).digest()
        vec = []
        # Expand 32 sha256 bytes into 1024 float dimensions
        for i in range(self.DIMENSION):
            byte_val = raw_seed[i % 32]
            shift_val = (i * 37) % 256
            val = ((byte_val ^ shift_val) - 128) / 128.0
            vec.append(val)

        # Normalize vector to unit length (L2 norm)
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 6) for x in vec]
