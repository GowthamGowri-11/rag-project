import logging
from typing import Any

from ingestion.embeddings.bge_m3 import BGEM3EmbeddingService
from vector_store.qdrant.client import QdrantKnowledgeStore

logger = logging.getLogger(__name__)

class DenseRetriever:
    """Retrieves top candidates using BGE-M3 dense embeddings and cosine similarity in Qdrant."""

    def __init__(self, vector_store: QdrantKnowledgeStore, embedding_service: BGEM3EmbeddingService):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    def retrieve(self, query: str, domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        dense_vec = self.embedding_service.embed_dense([query])[0]
        results = self.vector_store.search_dense(query_vector=dense_vec, domain=domain, limit=limit)
        return results
