import json
import os
import sys
import unittest

# Ensure ai-service is in sys.path
ai_service_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))
if ai_service_dir not in sys.path:
    sys.path.insert(0, ai_service_dir)

from app import app, gemini_generator, dynamic_domains_registry


class TestEvidenceGate(unittest.TestCase):
    """Rigorous verification of the Strict Evidence Gate and Anti-Hallucination guarantees.
    Asserts zero LLM latency (llm_latency_ms == 0) and directly checks the instrumented
    Gemini client to prove with 100% certainty that no LLM call occurred during refusals.
    """

    @classmethod
    def setUpClass(cls):
        print("\n" + "=" * 60)
        print("PHASE 7: STRICT EVIDENCE GATE & ZERO-LLM REFUSAL VERIFICATION")
        print("=" * 60)
        app.config['TESTING'] = True
        cls.client = app.test_client()

        # Ensure domains are registered
        dynamic_domains_registry["rag"] = "RAG Fundamentals"
        dynamic_domains_registry["cybersecurity"] = "Cyber Security"

    def setUp(self):
        # Reset the instrumented call counter before every individual test
        gemini_generator.reset_call_count()

    def test_01_strong_relevant_evidence_pass_gemini_called(self):
        """TEST 1: Strong relevant evidence -> Evidence Gate PASS -> Gemini invoked."""
        payload = {
            "query": "What is the vector dimension produced by BAAI/bge-m3?",
            "domain_override": "rag"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 1] Query: \"{payload['query']}\"")
        print(f"  Status        : {data['status']}")
        print(f"  Gate Score    : {data['telemetry']['evidence_score']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "ANSWERED")
        self.assertEqual(data["telemetry"]["evidence_status"], "PASS")
        self.assertGreater(data["telemetry"]["evidence_score"], 0.65)
        self.assertGreater(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 1, "Gemini MUST be called exactly once when evidence passes.")
        self.assertIn("1024", data["answer"])

    def test_02_no_evidence_fail_gemini_not_called(self):
        """TEST 2: No evidence candidates retrieved -> Gate FAIL -> Gemini NOT called."""
        # Query with empty chunks simulation
        payload = {
            "query": "Completely empty query with non-matching gibberish zzzqqqwww12345",
            "domain_override": "rag"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 2] Query: \"{payload['query']}\"")
        print(f"  Status        : {data['status']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0, "llm_latency_ms must be 0 for refusal.")
        self.assertEqual(gemini_generator.call_count, 0, "CRITICAL: Gemini was called despite NO evidence!")

    def test_03_weak_evidence_below_threshold_fail_gemini_not_called(self):
        """TEST 3: Weak evidence below confidence threshold -> Gate FAIL -> Gemini NOT called."""
        payload = {
            "query": "What are the agricultural soil properties for growing potatoes and wheat?",
            "domain_override": "rag"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 3] Query: \"{payload['query']}\"")
        print(f"  Status        : {data['status']}")
        print(f"  Evidence Score: {data['telemetry']['evidence_score']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 0, "CRITICAL: Gemini was called on weak evidence!")

    def test_04_wrong_domain_rejection_gemini_not_called(self):
        """TEST 4: Target domain does not exist -> Domain Rejection -> Gemini NOT called."""
        payload = {
            "query": "What is the diagnosis and protocol for myocardial infarction?",
            "domain_override": "non_existent_cardiology_domain"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 4] Query: \"{payload['query']}\" (Domain: non_existent_cardiology_domain)")
        print(f"  Status        : {data['status']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 0, "CRITICAL: Gemini was called on invalid domain!")

    def test_05_semantically_relevant_paraphrase_pass_gemini_called(self):
        """TEST 5: Semantically relevant paraphrase -> Gate PASS -> Gemini invoked."""
        payload = {
            "query": "In what manner does the system partition text by topic boundaries instead of character counts?",
            "domain_override": "rag"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 5] Query: \"{payload['query']}\"")
        print(f"  Status        : {data['status']}")
        print(f"  Evidence Score: {data['telemetry']['evidence_score']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "ANSWERED")
        self.assertEqual(data["telemetry"]["evidence_status"], "PASS")
        self.assertGreater(data["telemetry"]["evidence_score"], 0.65)
        self.assertGreater(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 1, "Gemini MUST be called when paraphrase evidence passes.")

    def test_06_known_domain_unrelated_question_fail_gemini_not_called(self):
        """TEST 6: Query in known domain 'cybersecurity' asking about unrelated topic -> FAIL -> Gemini NOT called."""
        payload = {
            "query": "Who was the Roman emperor during the construction of the Colosseum amphitheatre?",
            "domain_override": "cybersecurity"
        }
        res = self.client.post('/api/query', json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        print(f"\n[TEST 6] Query: \"{payload['query']}\" (Domain: cybersecurity)")
        print(f"  Status        : {data['status']}")
        print(f"  Evidence Score: {data['telemetry']['evidence_score']}")
        print(f"  LLM Latency   : {data['telemetry']['llm_latency_ms']} ms")
        print(f"  Gemini Calls  : {gemini_generator.call_count}")

        self.assertEqual(data["status"], "NO_EVIDENCE")
        self.assertEqual(data["telemetry"]["evidence_status"], "FAIL")
        self.assertEqual(data["telemetry"]["llm_latency_ms"], 0)
        self.assertEqual(gemini_generator.call_count, 0, "CRITICAL: Gemini was called for off-topic query!")


if __name__ == '__main__':
    unittest.main()
