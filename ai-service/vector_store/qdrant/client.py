import logging
import uuid
from typing import Any

logger = logging.getLogger(__name__)

class QdrantKnowledgeStore:
    """Dedicated knowledge database interface using Qdrant.
    Manages vector indexing, domain metadata payloads, and domain-isolated search.
    """

    def __init__(self, url: str, api_key: str | None = None, collection_name: str = "adaptive_domain_rag"):
        self.url = url
        self.api_key = api_key or None
        self.collection_name = collection_name
        self.client: Any = None
        self._is_connected = False
        self._memory_storage: dict[str, Any] = {} # In-memory fallback if remote Qdrant is unreachable
        self._init_connection()

    def _init_connection(self):
        try:
            from qdrant_client import QdrantClient

            if self.api_key:
                self.client = QdrantClient(url=self.url, api_key=self.api_key, timeout=10)
            elif self.url and (self.url.startswith("http://") or self.url.startswith("https://")):
                self.client = QdrantClient(url=self.url, timeout=10)
            else:
                self.client = QdrantClient(location=":memory:")

            # Test connectivity
            self.client.get_collections()
            self._is_connected = True
            logger.info(f"Connected to Qdrant successfully at {self.url}")
            self._ensure_collection()
        except Exception as e:  # noqa: BLE001
            logger.warning(
                f"Could not connect to remote Qdrant at {self.url} ({e!s}). "
                "Switching to in-memory simulated vector storage for development/scaffold."
            )
            self._is_connected = False

    def _ensure_collection(self):
        if not self._is_connected or not self.client:
            return
        try:
            from qdrant_client.http import models as qmodels
            collections = [c.name for c in self.client.get_collections().collections]
            if self.collection_name not in collections:
                logger.info(f"Creating Qdrant collection '{self.collection_name}'...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=qmodels.VectorParams(
                        size=1024,
                        distance=qmodels.Distance.COSINE
                    )
                )
                # Create payload index for domain isolation
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="domain",
                    field_schema=qmodels.PayloadSchemaType.KEYWORD
                )
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="document_id",
                    field_schema=qmodels.PayloadSchemaType.KEYWORD
                )
                logger.info(f"Collection '{self.collection_name}' created with domain indexes.")
        except Exception as e:  # noqa: BLE001
            logger.error(f"Error ensuring Qdrant collection: {e}")

    def upsert_chunks(
        self,
        chunks: list[Any],
        dense_vectors: list[list[float]],
        sparse_vectors: list[dict[int, float]] | None = None
    ) -> bool:
        """Stores chunk text, embeddings, and domain metadata in Qdrant."""
        if not chunks:
            return True

        if self._is_connected and self.client:
            try:
                from qdrant_client.http import models as qmodels
                points = []
                for idx, chunk in enumerate(chunks):
                    # Deterministic UUID from chunk id
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk.id))
                    payload = chunk.to_dict()
                    points.append(qmodels.PointStruct(
                        id=point_id,
                        vector=dense_vectors[idx],
                        payload=payload
                    ))
                self.client.upsert(collection_name=self.collection_name, points=points)
                return True
            except Exception as e:  # noqa: BLE001
                logger.error(f"Qdrant remote upsert failed: {e}. Storing in memory fallback.")

        # Fallback in-memory storage
        for idx, chunk in enumerate(chunks):
            self._memory_storage[chunk.id] = {
                "vector": dense_vectors[idx],
                "payload": chunk.to_dict()
            }
        return True

    def search_dense(self, query_vector: list[float], domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        """Domain-filtered dense vector search."""
        if self._is_connected and self.client:
            try:
                from qdrant_client.http import models as qmodels
                query_filter = None
                if domain:
                    query_filter = qmodels.Filter(
                        must=[qmodels.FieldCondition(key="domain", match=qmodels.MatchValue(value=domain.lower()))]
                    )

                client_any: Any = self.client
                if hasattr(client_any, "search"):
                    hits = client_any.search(
                        collection_name=self.collection_name,
                        query_vector=query_vector,
                        query_filter=query_filter,
                        limit=limit
                    )
                elif hasattr(client_any, "query_points"):
                    resp = client_any.query_points(
                        collection_name=self.collection_name,
                        query=query_vector,
                        query_filter=query_filter,
                        limit=limit
                    )
                    hits = getattr(resp, "points", [])
                else:
                    hits = []

                results = []
                for h in hits:
                    payload = getattr(h, "payload", None) or {}
                    score = getattr(h, "score", 0.0)
                    results.append({
                        "chunk_id": payload.get("chunk_id"),
                        "document_id": payload.get("document_id"),
                        "domain": payload.get("domain"),
                        "text": payload.get("text"),
                        "source_info": payload.get("source_info", {}),
                        "section": payload.get("section"),
                        "page": payload.get("page"),
                        "retrieval_score": float(score)
                    })
                return results
            except Exception as e:  # noqa: BLE001
                logger.error(f"Qdrant search error: {e}")

        # In-memory search fallback
        results = []
        for item in self._memory_storage.values():
            payload = item["payload"]
            if domain and payload.get("domain", "").lower() != domain.lower():
                continue
            # Cosine similarity calculation
            v = item["vector"]
            dot_product = sum(a * b for a, b in zip(query_vector, v))
            results.append({
                "chunk_id": payload.get("chunk_id"),
                "document_id": payload.get("document_id"),
                "domain": payload.get("domain"),
                "text": payload.get("text"),
                "source_info": payload.get("source_info", {}),
                "section": payload.get("section"),
                "page": payload.get("page"),
                "retrieval_score": round(max(dot_product, 0.0), 4)
            })
        results.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return results[:limit]

    def search_sparse(self, keywords: list[str], domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        """Lexical exact-match oriented search."""
        kw_set = {k.lower() for k in keywords}
        candidates = self.get_all_chunks_for_domain(domain)
        scored = []
        for c in candidates:
            text_lower = c["text"].lower()
            matches = sum(1 for kw in kw_set if kw in text_lower)
            if matches > 0:
                score = matches / max(len(kw_set), 1)
                scored.append({
                    **c,
                    "retrieval_score": round(score, 4)
                })
        scored.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return scored[:limit]

    def search_hybrid(self, query_vector: list[float], keywords: list[str], domain: str | None = None, limit: int = 30) -> list[dict[str, Any]]:
        """Hybrid fusion of dense vector and sparse keyword scores (Reciprocal Rank Fusion / weighted)."""
        dense_results = self.search_dense(query_vector, domain=domain, limit=limit)
        sparse_results = self.search_sparse(keywords, domain=domain, limit=limit)

        fused: dict[str, dict[str, Any]] = {}
        for r in dense_results:
            cid = r["chunk_id"]
            fused[cid] = {**r, "retrieval_score": r["retrieval_score"] * 0.7}

        for r in sparse_results:
            cid = r["chunk_id"]
            if cid in fused:
                fused[cid]["retrieval_score"] += r["retrieval_score"] * 0.3
            else:
                fused[cid] = {**r, "retrieval_score": r["retrieval_score"] * 0.3}

        results = list(fused.values())
        results.sort(key=lambda x: x["retrieval_score"], reverse=True)
        return results[:limit]

    def get_all_chunks_for_domain(self, domain: str | None = None) -> list[dict[str, Any]]:
        """Fetches chunks matching domain for keyword inspection or sparse scoring."""
        if self._is_connected and self.client:
            try:
                from qdrant_client.http import models as qmodels
                query_filter = None
                if domain:
                    query_filter = qmodels.Filter(
                        must=[qmodels.FieldCondition(key="domain", match=qmodels.MatchValue(value=domain.lower()))]
                    )
                points, _ = self.client.scroll(
                    collection_name=self.collection_name,
                    scroll_filter=query_filter,
                    limit=200,
                    with_payload=True
                )
                scroll_results = []
                for p in points:
                    payload = getattr(p, "payload", None) or {}
                    scroll_results.append({
                        "chunk_id": payload.get("chunk_id"),
                        "document_id": payload.get("document_id"),
                        "domain": payload.get("domain"),
                        "text": payload.get("text"),
                        "source_info": payload.get("source_info", {}),
                        "section": payload.get("section"),
                        "page": payload.get("page"),
                        "retrieval_score": 0.0
                    })
                return scroll_results
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error scrolling Qdrant: {e}")

        # Fallback memory
        results = []
        for item in self._memory_storage.values():
            p = item["payload"]
            if domain and p.get("domain", "").lower() != domain.lower():
                continue
            results.append({
                "chunk_id": p.get("chunk_id"),
                "document_id": p.get("document_id"),
                "domain": p.get("domain"),
                "text": p.get("text"),
                "source_info": p.get("source_info", {}),
                "section": p.get("section"),
                "page": p.get("page"),
                "retrieval_score": 0.0
            })
        return results

    def list_domains(self) -> list[dict[str, Any]]:
        """Lists all distinct domains present in the vector store."""
        domain_counts: dict[str, int] = {}
        if self._is_connected and self.client:
            try:
                points, _ = self.client.scroll(collection_name=self.collection_name, limit=1000, with_payload=True)
                for p in points:
                    payload = getattr(p, "payload", None) or {}
                    d = payload.get("domain")
                    if d:
                        domain_counts[d] = domain_counts.get(d, 0) + 1
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error reading domains from Qdrant: {e}")

        for item in self._memory_storage.values():
            d = item["payload"].get("domain")
            if d:
                domain_counts[d] = domain_counts.get(d, 0) + 1

        return [{"name": d, "chunk_count": count} for d, count in domain_counts.items()]

    def delete_document(self, document_id: str) -> bool:
        """Removes all vectors belonging to a given document ID."""
        if self._is_connected and self.client:
            try:
                from qdrant_client.http import models as qmodels
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=qmodels.FilterSelector(
                        filter=qmodels.Filter(
                            must=[qmodels.FieldCondition(key="document_id", match=qmodels.MatchValue(value=document_id))]
                        )
                    )
                )
            except Exception as e:  # noqa: BLE001
                logger.error(f"Error deleting doc from Qdrant: {e}")

        keys_to_del = [k for k, v in self._memory_storage.items() if v["payload"].get("document_id") == document_id]
        for k in keys_to_del:
            del self._memory_storage[k]
        return True

    def get_status(self) -> dict[str, Any]:
        return {
            "is_connected": self._is_connected,
            "url": self.url,
            "collection": self.collection_name,
            "in_memory_fallback_active": not self._is_connected or len(self._memory_storage) > 0
        }
