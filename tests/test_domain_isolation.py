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
from retrieval import DenseRetriever
from vector_store import QdrantKnowledgeStore
from app import app, dynamic_domains_registry, gemini_generator


class TestDomainIsolation(unittest.TestCase):
    """Verifies strict domain boundary enforcement and zero cross-domain leakage in Qdrant."""

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 11: DOMAIN ISOLATION & ZERO-LEAKAGE VERIFICATION")
        print("=" * 60)
        app.config['TESTING'] = True
        cls.client = app.test_client()

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

        dynamic_domains_registry["rag"] = "RAG Fundamentals"
        dynamic_domains_registry["cybersecurity"] = "Cybersecurity Guidelines"

    def setUp(self):
        gemini_generator.reset_call_count()

    def test_01_rag_query_cannot_retrieve_cybersecurity_chunks(self):
        """Querying in 'rag' domain must NEVER return cybersecurity chunks, even if semantically similar."""
        # Query mentioning CVE and vulnerability directed to rag domain
        query = "What is vulnerability CVE-2024-3094 in liblzma?"
        hits = self.dense_retriever.retrieve(query, domain="rag", limit=10)

        print(f"\n[Domain Isolation 1] Query: \"{query}\" (Domain: rag)")
        print(f"  Total chunks retrieved: {len(hits)}")
        for h in hits:
            print(f"    - Chunk domain: {h.get('domain')} | Doc: {h.get('source_info', {}).get('filename')}")
            self.assertEqual(
                h.get("domain"), "rag",
                f"LEAKAGE DETECTED! Found chunk from domain '{h.get('domain')}' in 'rag' search."
            )
            self.assertNotEqual(
                h.get("source_info", {}).get("filename"), "cybersecurity_specifications.md",
                "LEAKAGE DETECTED! Found cybersecurity document in RAG query!"
            )

    def test_02_cybersecurity_query_cannot_retrieve_rag_chunks(self):
        """Querying in 'cybersecurity' domain must NEVER return RAG chunks."""
        query = "What is semantic chunking and bge-m3 dense vector dimensions?"
        hits = self.dense_retriever.retrieve(query, domain="cybersecurity", limit=10)

        print(f"\n[Domain Isolation 2] Query: \"{query}\" (Domain: cybersecurity)")
        print(f"  Total chunks retrieved: {len(hits)}")
        for h in hits:
            print(f"    - Chunk domain: {h.get('domain')} | Doc: {h.get('source_info', {}).get('filename')}")
            self.assertEqual(
                h.get("domain"), "cybersecurity",
                f"LEAKAGE DETECTED! Found chunk from domain '{h.get('domain')}' in 'cybersecurity' search."
            )
            self.assertNotEqual(
                h.get("source_info", {}).get("filename"), "rag_architecture_guide.md",
                "LEAKAGE DETECTED! Found RAG document in cybersecurity query!"
            )

    def test_03_unknown_domain_rejected_before_retrieval_and_gemini(self):
        """Requesting an unindexed domain immediately rejects and bypasses Gemini."""
        payload = {
            "query": "What are the rules of clinical cardiology and myocardial infarction treatment?",
            "domain_override": "clinical_cardiology"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[Domain Isolation 3] Unknown domain 'clinical_cardiology' query")
        print(f"  Status        : {data['status']}")
        print(f"  Refusal Reason: {data.get('refusal_reason')}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 0)
        self.assertIn("not been uploaded or indexed", data.get("refusal_reason", ""))


if __name__ == '__main__':
    unittest.main()
