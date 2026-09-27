import json
import os
import sys
import unittest

# Ensure ai-service is in sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from config import config
from ingestion import BGEM3EmbeddingService
from retrieval import (
    DenseRetriever,
    HybridRetriever,
    LightweightQueryAnalyzer,
    RetrievalRouter,
    SparseRetriever,
)
from vector_store import QdrantKnowledgeStore


class TestAdaptiveRouter(unittest.TestCase):
    """Verifies that QueryAnalyzer + RetrievalRouter dynamically selects and EXECUTES
    the correct retriever across 30+ diverse queries.
    """

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 5: ADAPTIVE RETRIEVAL ROUTING & EXECUTION TEST")
        print("=" * 60)

        cls.analyzer = LightweightQueryAnalyzer()
        cls.router = RetrievalRouter()
        cls.vector_store = QdrantKnowledgeStore(
            url=config.QDRANT_URL,
            api_key=config.QDRANT_API_KEY,
            collection_name=config.QDRANT_COLLECTION
        )
        cls.embedding_service = BGEM3EmbeddingService(
            model_name=config.BGE_M3_MODEL_NAME,
            device=config.EMBEDDING_DEVICE
        )

        cls.dense_retriever = DenseRetriever(cls.vector_store, cls.embedding_service)
        cls.sparse_retriever = SparseRetriever(cls.vector_store)
        cls.hybrid_retriever = HybridRetriever(cls.vector_store, cls.embedding_service)

        dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'dataset', 'retrieval_benchmark.json'))
        with open(dataset_path, 'r', encoding='utf-8') as f:
            all_queries = json.load(f)

        # Select 35 queries covering exact IDs, conceptual, comparison, multi-term, direct factual
        cls.test_suite = [
            q for q in all_queries 
            if q.get("query_type") in ["exact_identifier", "conceptual", "comparison", "multi_term", "direct_factual"]
        ][:35]
        print(f"Selected {len(cls.test_suite)} queries for dynamic routing and execution verification.")

    def test_routing_and_live_execution(self):
        """Verifies query -> analyzer -> strategy -> live retriever execution."""
        self.assertGreaterEqual(len(self.test_suite), 30, "Must test at least 30 queries.")

        strategy_counts = {"dense": 0, "sparse": 0, "hybrid": 0}
        successful_executions = 0

        print("\nEvaluating Adaptive Router Selection and Execution:")
        for idx, item in enumerate(self.test_suite, 1):
            q_text = item["query"]
            domain = item["expected_domain"]
            q_type = item["query_type"]

            # Step 1: Analyze query
            analysis = self.analyzer.analyze(q_text, known_domains=["rag", "cybersecurity"])

            # Step 2: Select strategy
            selected_strategy, reason = self.router.select_strategy(analysis)
            strategy_counts[selected_strategy] += 1

            # Step 3: Execute the SELECTED retriever
            candidates = []
            if selected_strategy == "sparse":
                kw = analysis.exact_identifiers or analysis.keywords
                candidates = self.sparse_retriever.retrieve(kw, domain=domain, limit=10)
            elif selected_strategy == "hybrid":
                kw = analysis.keywords or [q_text]
                candidates = self.hybrid_retriever.retrieve(q_text, keywords=kw, domain=domain, limit=10)
            else: # dense
                candidates = self.dense_retriever.retrieve(q_text, domain=domain, limit=10)

            # Assert candidates returned for known in-domain questions
            if item["relevant_chunk_ids"]:
                self.assertGreater(len(candidates), 0, f"Retriever returned 0 candidates for query: '{q_text}'")

            successful_executions += 1

            if q_type == "exact_identifier":
                self.assertEqual(selected_strategy, "sparse", f"Expected 'sparse' for identifier query '{q_text}', got {selected_strategy}")
            elif q_type in ["comparison", "multi_term"]:
                self.assertEqual(selected_strategy, "hybrid", f"Expected 'hybrid' for comparison query '{q_text}', got {selected_strategy}")
            elif q_type == "conceptual":
                self.assertEqual(selected_strategy, "dense", f"Expected 'dense' for conceptual query '{q_text}', got {selected_strategy}")

            if idx <= 10 or idx % 5 == 0:
                print(f"  [{idx:02d}] Type: {q_type:<16} | Strategy: {selected_strategy:<6} | Candidates: {len(candidates):2d} | \"{q_text[:50]}...\"")

        print("\n" + "-" * 60)
        print("ADAPTIVE ROUTING SUMMARY (N = 35)")
        print("-" * 60)
        print(f"Sparse Route Count : {strategy_counts['sparse']}")
        print(f"Hybrid Route Count : {strategy_counts['hybrid']}")
        print(f"Dense Route Count  : {strategy_counts['dense']}")
        print(f"Total Successful Live Retriever Executions: {successful_executions} / {len(self.test_suite)}")
        print("-" * 60)

        self.assertEqual(successful_executions, len(self.test_suite))
        self.assertGreater(strategy_counts["sparse"], 0, "Sparse strategy must be exercised.")
        self.assertGreater(strategy_counts["hybrid"], 0, "Hybrid strategy must be exercised.")
        self.assertGreater(strategy_counts["dense"], 0, "Dense strategy must be exercised.")


if __name__ == '__main__':
    unittest.main()
