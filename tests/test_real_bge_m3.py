import os
import sys
import unittest
import numpy as np

# Ensure ai-service is in sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from config import config
from ingestion import BGEM3EmbeddingService
from vector_store import QdrantKnowledgeStore
from ingestion.loaders.base import DocumentRepresentation
from ingestion.chunking.strategies import DocumentChunk


class TestRealBGEM3(unittest.TestCase):
    """Rigorous verification of the real BAAI/bge-m3 model and FlagEmbedding execution."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 1: REAL BGE-M3 MODEL VERIFICATION")
        print("=" * 60)
        cls.embedding_service = BGEM3EmbeddingService(
            model_name=config.BGE_M3_MODEL_NAME,
            device=config.EMBEDDING_DEVICE
        )
        cls.vector_store = QdrantKnowledgeStore(
            url=config.QDRANT_URL,
            api_key=config.QDRANT_API_KEY,
            collection_name=config.QDRANT_COLLECTION
        )

    def test_01_model_initialization_and_weights(self):
        """Verify native FlagEmbedding model is loaded with real weights (no mock/fallback)."""
        self.assertTrue(
            self.embedding_service._is_native_loaded,
            "CRITICAL FAIL: BGE-M3 native model failed to load. Fake/fallback models are strictly prohibited."
        )
        self.assertIsNotNone(
            self.embedding_service._model,
            "CRITICAL FAIL: Native FlagEmbedding._model instance is None."
        )
        model_class_name = self.embedding_service._model.__class__.__name__
        print(f"BGE MODEL: PASS")
        print(f"MODEL ID: {self.embedding_service.model_name}")
        print(f"LOADER CLASS: {model_class_name}")
        self.assertTrue(
            any(k in model_class_name for k in ["M3", "BGEM3", "FlagModel"]),
            f"Expected BGE-M3 model class, got {model_class_name}"
        )

    def test_02_embedding_generation_and_dimensionality(self):
        """Verify real dense 1024-dim embedding and lexical sparse weights are generated."""
        sample_text = "Adaptive Domain-Aware Retrieval-Augmented Generation with strict grounding."
        dense_vecs = self.embedding_service.embed_dense([sample_text])
        self.assertEqual(len(dense_vecs), 1)
        vec = dense_vecs[0]

        dim = len(vec)
        print(f"DENSE DIMENSION: {dim}")
        print(f"EMBEDDING GENERATED: YES")
        self.assertEqual(dim, 1024, f"BGE-M3 dense dimension must be 1024, got {dim}")

        # Check non-zero, float values
        arr = np.array(vec, dtype=float)
        norm = np.linalg.norm(arr)
        print(f"VECTOR L2 NORM: {norm:.6f} (sample values: [{vec[0]:.4f}, {vec[1]:.4f}, {vec[2]:.4f}...])")
        self.assertGreater(norm, 0.5, "Vector norm is suspiciously low or zero.")
        self.assertFalse(np.all(arr == 0), "Vector contains all zeros.")

        # Verify sparse embeddings
        sparse_vecs = self.embedding_service.embed_sparse([sample_text])
        self.assertEqual(len(sparse_vecs), 1)
        sparse_weights = sparse_vecs[0]
        print(f"SPARSE TOKENS GENERATED: {len(sparse_weights)} active lexical weights")
        self.assertGreater(len(sparse_weights), 0, "Sparse lexical weights must not be empty.")

    def test_03_determinism_and_semantic_differentiation(self):
        """Verify identical inputs yield identical vectors, distinct texts yield distinct vectors."""
        text_a = "Quantum computing uses superposition and entanglement."
        text_b = "Quantum computing uses superposition and entanglement."
        text_c = "The culinary recipe requires fresh basil, olive oil, and garlic."

        vec_a = np.array(self.embedding_service.embed_dense([text_a])[0])
        vec_b = np.array(self.embedding_service.embed_dense([text_b])[0])
        vec_c = np.array(self.embedding_service.embed_dense([text_c])[0])

        # Cosine similarity
        sim_ab = np.dot(vec_a, vec_b) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_b))
        sim_ac = np.dot(vec_a, vec_c) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_c))

        print(f"COSINE SIMILARITY (Identical texts A vs B): {sim_ab:.6f}")
        print(f"COSINE SIMILARITY (Physics vs Cooking A vs C): {sim_ac:.6f}")

        self.assertAlmostEqual(sim_ab, 1.0, places=4, msg="Identical inputs must yield identical embeddings.")
        self.assertLess(sim_ac, 0.70, msg="Unrelated texts must have meaningfully lower similarity.")

    def test_04_qdrant_storage_and_retrieval(self):
        """Verify real BGE-M3 vectors are successfully inserted into Qdrant Cloud and retrievable."""
        test_chunk_id = f"test_bge_m3_chunk_{os.getpid()}"
        chunk = DocumentChunk(
            id=test_chunk_id,
            document_id="test_bge_m3_doc",
            domain="validation_test",
            document_type="txt",
            text="BGE-M3 multi-lingual dense vector verification document in validation suite.",
            section="Verification",
            page=1,
            chunk_strategy="fixed-size",
            chunk_size=100,
            overlap=0,
            source_info={"filename": "test_verification.txt"}
        )

        dense_vec = self.embedding_service.embed_dense([chunk.text])
        sparse_vec = self.embedding_service.embed_sparse([chunk.text])

        # Upsert into Qdrant
        success = self.vector_store.upsert_chunks([chunk], dense_vec, sparse_vec)
        self.assertTrue(success, "Qdrant chunk upsert failed.")
        print("QDRANT INSERTION: PASS")

        # Retrieve back via dense search
        hits = self.vector_store.search_dense(dense_vec[0], domain="validation_test", limit=5)
        matched = any(h.get("chunk_id") == test_chunk_id for h in hits)
        print(f"QDRANT RETRIEVAL CHECK: {'PASS' if matched else 'FAIL'} (Returned {len(hits)} hits)")
        self.assertTrue(matched, "Inserted chunk was not found in domain-filtered search.")

        # Clean up test document
        self.vector_store.delete_document("test_bge_m3_doc")


if __name__ == '__main__':
    unittest.main()
