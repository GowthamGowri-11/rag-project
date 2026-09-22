import os
import sys
import unittest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, dynamic_domains_registry


class TestAdaptiveRAGE2E(unittest.TestCase):

    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_01_health_check(self):
        res = self.client.get('/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "HEALTHY")
        self.assertIn("qdrant", data)

    def test_02_dynamic_domain_creation(self):
        res = self.client.post('/api/domains', json={
            "name": "Clinical",
            "description": "Clinical guidelines and patient protocols"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["id"], "clinical")
        self.assertIn("clinical", dynamic_domains_registry)

    def test_03_document_ingestion_rag_domain(self):
        sample_doc = (
            "Adaptive Domain-Aware RAG is an architectural pattern that partitions knowledge "
            "into isolated vector namespaces. When a user queries the knowledge base, the query analyzer "
            "identifies the target domain and selects an appropriate retrieval strategy."
        )
        res = self.client.post('/api/ingest', data={
            "domain": "rag",
            "filename": "adaptive_rag_primer.txt",
            "content": sample_doc
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertIn("document_id", data)
        self.assertEqual(data["domain"], "rag")
        self.assertGreaterEqual(data["chunk_count"], 1)

    def test_04_query_known_domain_with_evidence(self):
        # Query matching the ingested RAG document
        res = self.client.post('/api/query', json={
            "query": "What is Adaptive Domain-Aware RAG and how does it partition knowledge?",
            "domain_override": "rag"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["status"], "ANSWERED")
        self.assertIn("sources", data)
        self.assertGreaterEqual(len(data["sources"]), 1)
        self.assertIn("telemetry", data)
        self.assertEqual(data["telemetry"]["evidence_status"], "PASS")

    def test_05_anti_hallucination_refusal_unindexed_domain(self):
        # CRITICAL TEST: Query about un-indexed topic (e.g. quantum entanglement or unindexed legal domain)
        res = self.client.post('/api/query', json={
            "query": "What are the rules of quantum computing entanglement and superconducting qubits?",
            "domain_override": "quantum_physics"  # Non-existent domain
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # MUST REFUSE! Must NOT call LLM to hallucinate general knowledge!
        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["answer"], "I don't have sufficient information about this topic in the available knowledge base.")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0) # ZERO LLM calls!

    def test_06_anti_hallucination_refusal_weak_evidence(self):
        # Querying an existing domain but asking for completely unrelated facts
        res = self.client.post('/api/query', json={
            "query": "What is the capital city of France and who was Napoleon Bonaparte?",
            "domain_override": "rag"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        # MUST REFUSE!
        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0)

if __name__ == '__main__':
    unittest.main()
