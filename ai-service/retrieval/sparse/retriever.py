from typing import Any

from vector_store.qdrant.client import QdrantKnowledgeStore


class SparseRetriever:
    """Retrieves top candidates using exact keyword / token frequency scoring."""

    def __init__(self, vector_store: QdrantKnowledgeStore):
        self.vector_store = vector_store

    def retrieve(self, keywords: list[str], domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        return self.vector_store.search_sparse(keywords=keywords, domain=domain, limit=limit)
