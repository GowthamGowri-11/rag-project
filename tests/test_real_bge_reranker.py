import os
import sys
import unittest

# Ensure ai-service is in sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from config import config
from retrieval import BGERerankerService
from vector_store import QdrantKnowledgeStore


class TestRealBGEReranker(unittest.TestCase):
    """Rigorous verification of the real BAAI/bge-reranker-v2-m3 cross-encoder model."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 2: REAL BGE RERANKER VERIFICATION")
        print("=" * 60)
        cls.reranker_service = BGERerankerService(
            model_name=config.BGE_RERANKER_MODEL_NAME,
            device=config.EMBEDDING_DEVICE
        )

    def test_01_model_initialization(self):
        """Verify native FlagReranker is loaded with real weights (no fallback)."""
        self.assertTrue(
            self.reranker_service._is_native_loaded,
            "CRITICAL FAIL: BGE Reranker native model failed to load. Fallbacks are strictly prohibited."
        )
        self.assertIsNotNone(
            self.reranker_service._reranker,
            "CRITICAL FAIL: FlagReranker instance is None."
        )
        model_class = self.reranker_service._reranker.__class__.__name__
        print("BGE RERANKER MODEL: PASS")
        print(f"MODEL ID: {self.reranker_service.model_name}")
        print(f"LOADER CLASS: {model_class}")
        self.assertIn("Reranker", model_class)

    def test_02_semantic_discrimination_and_scoring(self):
        """Verify real cross-encoder scores: relevant document MUST score higher than irrelevant."""
        query = "What is the purpose of the authentication system?"
        doc_relevant = "The authentication system verifies user credentials and controls access."
        doc_irrelevant = "The database stores weather observations and sensor readings."

        candidates = [
            {"chunk_id": "doc_irr", "text": doc_irrelevant},
            {"chunk_id": "doc_rel", "text": doc_relevant}
        ]

        reranked = self.reranker_service.rerank(query, candidates, top_n=2)

        self.assertEqual(len(reranked), 2)
        top_result = reranked[0]
        second_result = reranked[1]

        score_rel = next(c["rerank_score"] for c in reranked if c["chunk_id"] == "doc_rel")
        score_irr = next(c["rerank_score"] for c in reranked if c["chunk_id"] == "doc_irr")

        print(f"QUERY: \"{query}\"")
        print(f"  [Relevant Chunk Score]  : {score_rel:.4f} -> \"{doc_relevant}\"")
        print(f"  [Irrelevant Chunk Score]: {score_irr:.4f} -> \"{doc_irrelevant}\"")
        print(f"  [Score Delta]           : {(score_rel - score_irr):.4f}")

        self.assertEqual(
            top_result["chunk_id"], "doc_rel",
            "CRITICAL FAIL: Relevant document did NOT rank first!"
        )
        self.assertGreater(
            score_rel, score_irr,
            "CRITICAL FAIL: Relevant document score must be strictly greater than irrelevant document score."
        )
        self.assertGreater(
            score_rel - score_irr, 0.40,
            "CRITICAL FAIL: Expected significant score separation between relevant and irrelevant text."
        )

    def test_03_reranker_sorting_pipeline_integration(self):
        """Verify sorting and top_n truncation on a multi-candidate pool."""
        query = "How is data encrypted in transit?"
        pool = [
            {"chunk_id": "c1", "text": "Apples and oranges are common orchard fruits."},
            {"chunk_id": "c2", "text": "TLS 1.3 protocol encrypts all payload transmissions between client and server."},
            {"chunk_id": "c3", "text": "The building thermostat is set to 22 degrees Celsius."},
            {"chunk_id": "c4", "text": "End-to-end encryption ensures data packets cannot be intercepted in transit."},
            {"chunk_id": "c5", "text": "The quarterly financial report was published last Thursday."}
        ]

        top_2 = self.reranker_service.rerank(query, pool, top_n=2)
        self.assertEqual(len(top_2), 2)

        top_ids = [c["chunk_id"] for c in top_2]
        print(f"MULTI-CANDIDATE RERANK TOP 2: {top_ids}")
        for rank, c in enumerate(top_2, 1):
            print(f"  Rank {rank} (score: {c['rerank_score']:.4f}): {c['text']}")

        # Expect c2 and c4 to be the top 2 (both about encryption in transit)
        self.assertIn("c2", top_ids)
        self.assertIn("c4", top_ids)
        self.assertNotIn("c1", top_ids)
        self.assertNotIn("c3", top_ids)
        self.assertNotIn("c5", top_ids)


if __name__ == '__main__':
    unittest.main()
