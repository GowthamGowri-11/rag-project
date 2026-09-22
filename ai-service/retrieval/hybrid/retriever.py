from typing import Any

from ingestion.embeddings.bge_m3 import BGEM3EmbeddingService
from vector_store.qdrant.client import QdrantKnowledgeStore


class HybridRetriever:
    """Retrieves top candidates combining BGE-M3 dense semantics and sparse lexical matching."""

    def __init__(self, vector_store: QdrantKnowledgeStore, embedding_service: BGEM3EmbeddingService):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    def retrieve(self, query: str, keywords: list[str], domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        dense_vec = self.embedding_service.embed_dense([query])[0]
        return self.vector_store.search_hybrid(
            query_vector=dense_vec,
            keywords=keywords,
            domain=domain,
            limit=limit
        )
