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
from retrieval import BGERerankerService, DenseRetriever
from vector_store import QdrantKnowledgeStore


class TestSemanticRetrieval(unittest.TestCase):
    """Evaluates semantic understanding on 20+ paraphrase test cases.
    Compares Dense retrieval vs Dense + BGE Reranker with real metric calculations.
    """

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 4: SEMANTIC RETRIEVAL & PARAPHRASE EVALUATION")
        print("=" * 60)

        cls.vector_store = QdrantKnowledgeStore(
            url=config.QDRANT_URL,
            api_key=config.QDRANT_API_KEY,
            collection_name=config.QDRANT_COLLECTION
        )
        cls.embedding_service = BGEM3EmbeddingService(
            model_name=config.BGE_M3_MODEL_NAME,
            device=config.EMBEDDING_DEVICE
        )
        cls.reranker_service = BGERerankerService(
            model_name=config.BGE_RERANKER_MODEL_NAME,
            device=config.EMBEDDING_DEVICE
        )
        cls.dense_retriever = DenseRetriever(cls.vector_store, cls.embedding_service)

        dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation', 'dataset', 'retrieval_benchmark.json'))
        with open(dataset_path, 'r', encoding='utf-8') as f:
            all_queries = json.load(f)

        # Filter strictly for paraphrase test cases
        cls.paraphrases = [q for q in all_queries if q.get("query_type") == "paraphrase"]
        print(f"Loaded {len(cls.paraphrases)} explicit paraphrase test cases (Minimum requirement: 20)")

    def test_semantic_paraphrase_evaluation(self):
        """Measures Recall@5, Precision@5, MRR, Hit@5 for Dense vs Dense+Reranker."""
        self.assertGreaterEqual(len(self.paraphrases), 20, "Must have at least 20 paraphrase cases.")

        k = 5
        dense_hits = 0
        dense_reciprocal_ranks = []
        dense_recalls = []
        dense_precisions = []

        reranked_hits = 0
        reranked_reciprocal_ranks = []
        reranked_recalls = []
        reranked_precisions = []

        print("\nEvaluating Paraphrase Queries:")
        for idx, item in enumerate(self.paraphrases, 1):
            q_text = item["query"]
            domain = item["expected_domain"]
            target_ids = set(item["relevant_chunk_ids"])

            # 1. Dense retrieval only
            dense_candidates = self.dense_retriever.retrieve(q_text, domain=domain, limit=15)
            dense_top_k = dense_candidates[:k]
            dense_retrieved_ids = [c["chunk_id"] for c in dense_top_k]

            # Metric: Dense Hit and Rank
            dense_hit = 0
            dense_rr = 0.0
            for rank, cid in enumerate(dense_retrieved_ids, 1):
                if cid in target_ids:
                    dense_hit = 1
                    dense_rr = 1.0 / rank
                    break
            dense_hits += dense_hit
            dense_reciprocal_ranks.append(dense_rr)

            relevant_retrieved = len(target_ids.intersection(dense_retrieved_ids))
            dense_recalls.append(relevant_retrieved / max(len(target_ids), 1))
            dense_precisions.append(relevant_retrieved / k)

            # 2. Dense + BGE Reranker
            reranked_candidates = self.reranker_service.rerank(q_text, dense_candidates, top_n=k)
            reranked_ids = [c["chunk_id"] for c in reranked_candidates]

            # Metric: Reranked Hit and Rank
            rerank_hit = 0
            rerank_rr = 0.0
            for rank, cid in enumerate(reranked_ids, 1):
                if cid in target_ids:
                    rerank_hit = 1
                    rerank_rr = 1.0 / rank
                    break
            reranked_hits += rerank_hit
            reranked_reciprocal_ranks.append(rerank_rr)

            relevant_reranked = len(target_ids.intersection(reranked_ids))
            reranked_recalls.append(relevant_reranked / max(len(target_ids), 1))
            reranked_precisions.append(relevant_reranked / k)

            if idx <= 5 or dense_rr != rerank_rr:
                print(f"  [{idx:02d}] \"{q_text[:60]}...\"")
                print(f"       Dense Rank: {int(1/dense_rr) if dense_rr > 0 else 'None'} | Reranked Rank: {int(1/rerank_rr) if rerank_rr > 0 else 'None'}")

        total = len(self.paraphrases)
        dense_hit_rate = dense_hits / total
        dense_mrr = sum(dense_reciprocal_ranks) / total
        dense_avg_recall = sum(dense_recalls) / total
        dense_avg_precision = sum(dense_precisions) / total

        rerank_hit_rate = reranked_hits / total
        rerank_mrr = sum(reranked_reciprocal_ranks) / total
        rerank_avg_recall = sum(reranked_recalls) / total
        rerank_avg_precision = sum(reranked_precisions) / total

        print("\n" + "-" * 60)
        print("SEMANTIC PARAPHRASE RETRIEVAL RESULTS (N = 22)")
        print("-" * 60)
        print(f"Metric              | Dense Only | Dense + BGE Reranker | Delta")
        print(f"Hit Rate @ {k}        | {dense_hit_rate * 100:.1f}%     | {rerank_hit_rate * 100:.1f}%              | +{(rerank_hit_rate - dense_hit_rate) * 100:.1f}%")
        print(f"MRR                 | {dense_mrr:.4f}     | {rerank_mrr:.4f}               | +{(rerank_mrr - dense_mrr):.4f}")
        print(f"Recall @ {k}         | {dense_avg_recall * 100:.1f}%     | {rerank_avg_recall * 100:.1f}%              | +{(rerank_avg_recall - dense_avg_recall) * 100:.1f}%")
        print(f"Precision @ {k}      | {dense_avg_precision * 100:.1f}%     | {rerank_avg_precision * 100:.1f}%              | +{(rerank_avg_precision - dense_avg_precision) * 100:.1f}%")
        print("-" * 60)

        # Assertions proving genuine semantic comprehension
        self.assertGreaterEqual(dense_hit_rate, 0.80, "Dense semantic Hit Rate must exceed 80% on paraphrases.")
        self.assertGreaterEqual(rerank_hit_rate, 0.90, "Dense + Reranker Hit Rate must reach at least 90%.")
        self.assertGreaterEqual(rerank_mrr, dense_mrr, "Reranker must maintain or improve MRR over raw dense search.")


if __name__ == '__main__':
    unittest.main()
