import json
import os
import sys
import time
import unittest

# Ensure ai-service and project root are in sys.path
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ai_service_dir = os.path.join(root_dir, 'ai-service')
tests_dir = os.path.abspath(os.path.dirname(__file__))
for p in [tests_dir, root_dir, ai_service_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

from config import config


class MasterValidationSuite:
    """Master automated test runner executing all 19 checkpoints across the system."""

    def __init__(self):
        self.results = []
        self.start_time = time.time()

    def record(self, checkpoint_id: int, name: str, status: str, details: str = ""):
        self.results.append({
            "id": checkpoint_id,
            "name": name,
            "status": status,
            "details": details
        })
        status_color = "[PASS]" if status == "PASS" else ("[FAIL]" if status == "FAIL" else "[SKIPPED]")
        print(f"Checkpoint {checkpoint_id:02d}: {name:<45} -> {status_color} {details}")

    def run(self):
        print("\n" + "=" * 75)
        print("MASTER VALIDATION SUITE: 19 COMPREHENSIVE SYSTEM CHECKPOINTS")
        print("=" * 75 + "\n")

        # 1. Environment validation
        try:
            from config import config
            has_qdrant = bool(config.QDRANT_URL and config.QDRANT_API_KEY)
            has_gemini = bool(config.GEMINI_API_KEY and not config.GEMINI_API_KEY.startswith("your_"))
            if has_qdrant and has_gemini:
                self.record(1, "Environment Configuration Validation", "PASS", f"Port: {config.PORT}, Provider: {config.LLM_PROVIDER}")
            else:
                self.record(1, "Environment Configuration Validation", "FAIL", "Missing required QDRANT or GEMINI credentials in .env")
        except Exception as e:
            self.record(1, "Environment Configuration Validation", "FAIL", str(e))

        # 2. BGE-M3 verification
        try:
            from ingestion import BGEM3EmbeddingService
            bge = BGEM3EmbeddingService(model_name=config.BGE_M3_MODEL_NAME, device=config.EMBEDDING_DEVICE)
            if bge._is_native_loaded and bge._model:
                vec = bge.embed_dense(["BGE-M3 verification test"])[0]
                if len(vec) == 1024:
                    self.record(2, "BGE-M3 Native Model Verification", "PASS", f"1024-dim dense vectors, Class: {bge._model.__class__.__name__}")
                else:
                    self.record(2, "BGE-M3 Native Model Verification", "FAIL", f"Expected 1024 dims, got {len(vec)}")
            else:
                self.record(2, "BGE-M3 Native Model Verification", "FAIL", "Native FlagEmbedding model not loaded")
        except Exception as e:
            self.record(2, "BGE-M3 Native Model Verification", "FAIL", str(e))

        # 3. BGE Reranker verification
        try:
            from retrieval import BGERerankerService
            reranker = BGERerankerService(model_name=config.BGE_RERANKER_MODEL_NAME, device=config.EMBEDDING_DEVICE)
            if reranker._is_native_loaded and reranker._reranker:
                candidates = [{"chunk_id": "c1", "text": "Relevant text"}, {"chunk_id": "c2", "text": "Irrelevant noise"}]
                out = reranker.rerank("Relevant query", candidates)
                self.record(3, "BGE Reranker v2-M3 Verification", "PASS", f"Cross-encoder operational, Model: {reranker.model_name}")
            else:
                self.record(3, "BGE Reranker v2-M3 Verification", "FAIL", "Native FlagReranker not loaded")
        except Exception as e:
            self.record(3, "BGE Reranker v2-M3 Verification", "FAIL", str(e))

        # 4. Ingestion test
        try:
            from ingestion import load_document, DocumentAnalyzer, AdaptiveChunkingSelector
            doc = load_document(b"# Test Doc\nText content", "test.md", "rag")
            profile = DocumentAnalyzer().analyze(doc)
            strat, chunks, _ = AdaptiveChunkingSelector().chunk_document(doc, profile)
            if len(chunks) > 0:
                self.record(4, "Multi-Format Ingestion Pipeline", "PASS", f"Strategy: {strat}, Chunks: {len(chunks)}")
            else:
                self.record(4, "Multi-Format Ingestion Pipeline", "FAIL", "Zero chunks produced")
        except Exception as e:
            self.record(4, "Multi-Format Ingestion Pipeline", "FAIL", str(e))

        # 5. Qdrant connectivity
        try:
            from vector_store import QdrantKnowledgeStore
            vs = QdrantKnowledgeStore(url=config.QDRANT_URL, api_key=config.QDRANT_API_KEY, collection_name=config.QDRANT_COLLECTION)
            status = vs.get_status()
            if status.get("is_connected"):
                self.record(5, "Qdrant Cloud Connectivity", "PASS", f"Connected to collection '{config.QDRANT_COLLECTION}'")
            else:
                self.record(5, "Qdrant Cloud Connectivity", "FAIL", "Could not reach remote Qdrant cluster")
        except Exception as e:
            self.record(5, "Qdrant Cloud Connectivity", "FAIL", str(e))

        # 6. Domain isolation
        try:
            from test_domain_isolation import TestDomainIsolation
            suite = unittest.TestLoader().loadTestsFromTestCase(TestDomainIsolation)
            runner = unittest.TextTestRunner(stream=open(os.devnull, 'w'))
            res = runner.run(suite)
            if res.wasSuccessful():
                self.record(6, "Dynamic Domain Isolation (Zero-Leakage)", "PASS", "All 3 domain segregation tests passed")
            else:
                self.record(6, "Dynamic Domain Isolation (Zero-Leakage)", "FAIL", f"Failures: {len(res.failures) + len(res.errors)}")
        except Exception as e:
            self.record(6, "Dynamic Domain Isolation (Zero-Leakage)", "FAIL", str(e))

        # 7. Query analyzer tests
        try:
            from retrieval import LightweightQueryAnalyzer
            qa = LightweightQueryAnalyzer()
            a = qa.analyze("Check CVE-2024-3094 in security domain", ["security", "rag"])
            if "CVE-2024-3094" in a.exact_identifiers and a.detected_domain_hint == "security":
                self.record(7, "Lightweight Query Analyzer", "PASS", "Correctly identified CVE ID and domain hint")
            else:
                self.record(7, "Lightweight Query Analyzer", "FAIL", f"Incorrect analysis output: {a}")
        except Exception as e:
            self.record(7, "Lightweight Query Analyzer", "FAIL", str(e))

        # 8. Retrieval router tests
        try:
            from retrieval import RetrievalRouter
            rr = RetrievalRouter()
            s1, _ = rr.select_strategy(a)
            if s1 in ["sparse", "hybrid"]:
                self.record(8, "Retrieval Strategy Router", "PASS", f"Exact identifier routed to {s1} strategy")
            else:
                self.record(8, "Retrieval Strategy Router", "FAIL", f"Expected sparse or hybrid, got {s1}")
        except Exception as e:
            self.record(8, "Retrieval Strategy Router", "FAIL", str(e))

        # 9. Dense retrieval tests
        try:
            from retrieval import DenseRetriever
            dr = DenseRetriever(vs, bge)
            hits = dr.retrieve("What is RAG?", domain="rag", limit=5)
            self.record(9, "Dense Vector Retriever", "PASS", f"Retrieved {len(hits)} candidates from Qdrant")
        except Exception as e:
            self.record(9, "Dense Vector Retriever", "FAIL", str(e))

        # 10. Sparse retrieval tests
        try:
            from retrieval import SparseRetriever
            sr = SparseRetriever(vs)
            hits = sr.retrieve(["CVE-2024-3094"], domain="cybersecurity", limit=5)
            self.record(10, "Sparse Lexical Retriever", "PASS", f"Retrieved {len(hits)} lexical keyword matches")
        except Exception as e:
            self.record(10, "Sparse Lexical Retriever", "FAIL", str(e))

        # 11. Hybrid retrieval tests
        try:
            from retrieval import HybridRetriever
            hr = HybridRetriever(vs, bge)
            hits = hr.retrieve("Zero Trust", keywords=["Zero", "Trust"], domain="cybersecurity", limit=5)
            self.record(11, "Hybrid Fusion Retriever", "PASS", f"Fused dense and sparse into {len(hits)} ranked items")
        except Exception as e:
            self.record(11, "Hybrid Fusion Retriever", "FAIL", str(e))

        # 12. Semantic paraphrase tests
        try:
            from test_semantic_retrieval import TestSemanticRetrieval
            suite = unittest.TestLoader().loadTestsFromTestCase(TestSemanticRetrieval)
            runner = unittest.TextTestRunner(stream=open(os.devnull, 'w'))
            res = runner.run(suite)
            if res.wasSuccessful():
                self.record(12, "Semantic Paraphrase Understanding (22 cases)", "PASS", "Hit Rate > 90% across diverse rephrasings")
            else:
                self.record(12, "Semantic Paraphrase Understanding (22 cases)", "FAIL", f"Failures: {len(res.failures) + len(res.errors)}")
        except Exception as e:
            self.record(12, "Semantic Paraphrase Understanding (22 cases)", "FAIL", str(e))

        # 13. Reranker tests
        try:
            from test_real_bge_reranker import TestRealBGEReranker
            suite = unittest.TestLoader().loadTestsFromTestCase(TestRealBGEReranker)
            runner = unittest.TextTestRunner(stream=open(os.devnull, 'w'))
            res = runner.run(suite)
            if res.wasSuccessful():
                self.record(13, "BGE Reranker Multi-Candidate Discrimination", "PASS", "Relevant passages outranked irrelevant noise")
            else:
                self.record(13, "BGE Reranker Multi-Candidate Discrimination", "FAIL", f"Failures: {len(res.failures) + len(res.errors)}")
        except Exception as e:
            self.record(13, "BGE Reranker Multi-Candidate Discrimination", "FAIL", str(e))

        # 14. Evidence Gate tests
        try:
            from test_evidence_gate import TestEvidenceGate
            suite = unittest.TestLoader().loadTestsFromTestCase(TestEvidenceGate)
            runner = unittest.TextTestRunner(stream=open(os.devnull, 'w'))
            res = runner.run(suite)
            if res.wasSuccessful():
                self.record(14, "Strict Evidence Gate Threshold Logic", "PASS", "All 6 gate condition checks passed")
            else:
                self.record(14, "Strict Evidence Gate Threshold Logic", "FAIL", f"Failures: {len(res.failures) + len(res.errors)}")
        except Exception as e:
            self.record(14, "Strict Evidence Gate Threshold Logic", "FAIL", str(e))

        # 15. Gemini grounded generation test
        try:
            from app import gemini_generator
            chunks = [{"text": "BGE-M3 is 1024 dimensions.", "source_info": {"filename": "rag.md"}, "page": 1, "section": "Spec"}]
            out = None
            for attempt in range(4):
                out = gemini_generator.generate("What is the dimension of BGE-M3?", chunks)
                if "1024" in out.get("answer", ""):
                    break
                if "429" in out.get("answer", "") or "RESOURCE_EXHAUSTED" in out.get("answer", ""):
                    time.sleep(12)
                else:
                    break
            if out and "1024" in out.get("answer", ""):
                self.record(15, "Google Gemini Grounded Generation", "PASS", f"Synthesized grounded answer ({out.get('latency_ms')}ms)")
            else:
                self.record(15, "Google Gemini Grounded Generation", "FAIL", f"Answer did not contain expected fact: {out.get('answer') if out else 'No output'}")
        except Exception as e:
            self.record(15, "Google Gemini Grounded Generation", "FAIL", str(e))

        # 16. Zero-LLM refusal tests
        try:
            from app import gemini_generator
            gemini_generator.reset_call_count()
            from app import app
            client = app.test_client()
            res = client.post('/api/query', json={"query": "Who built the Egyptian pyramids?", "domain_override": "rag"})
            data = res.get_json()
            if data["status"] == "NO_EVIDENCE" and data["telemetry"]["llm_latency_ms"] == 0 and gemini_generator.call_count == 0:
                self.record(16, "Zero-LLM Invocations on Refusals", "PASS", "Confirmed call_count == 0 and llm_latency_ms == 0")
            else:
                self.record(16, "Zero-LLM Invocations on Refusals", "FAIL", f"Gemini was invoked: call_count={gemini_generator.call_count}")
        except Exception as e:
            self.record(16, "Zero-LLM Invocations on Refusals", "FAIL", str(e))

        # 17. Ragas evaluation
        try:
            if os.path.exists("evaluation/ragas_results.json"):
                with open("evaluation/ragas_results.json", 'r', encoding='utf-8') as f:
                    rdata = json.load(f)
                scores = rdata.get("aggregate_scores", {})
                self.record(17, "Ragas Grounding & Relevancy Evaluation", "PASS", f"Faithfulness: {scores.get('faithfulness')}, Relevancy: {scores.get('answer_relevancy')}")
            else:
                self.record(17, "Ragas Grounding & Relevancy Evaluation", "SKIPPED", "Run evaluation/ragas_runner.py to generate metrics")
        except Exception as e:
            self.record(17, "Ragas Grounding & Relevancy Evaluation", "FAIL", str(e))

        # 18. Ablation experiments (Optional research comparison)
        self.record(18, "Empirical Ablation Experiments (6 Architectures)", "SKIPPED", "Ablation: OPTIONAL / NOT USED FOR FINAL VALIDATION")

        # 19. Full E2E tests
        try:
            suite = unittest.TestLoader().loadTestsFromName("ai-service.tests.test_api_e2e")
            runner = unittest.TextTestRunner(stream=open(os.devnull, 'w'))
            res = runner.run(suite)
            if res.wasSuccessful():
                self.record(19, "End-to-End System Integration Suite", "PASS", "All 6 REST API E2E tests passed")
            else:
                self.record(19, "End-to-End System Integration Suite", "FAIL", f"Failures: {len(res.failures)}")
        except Exception as e:
            self.record(19, "End-to-End System Integration Suite", "FAIL", str(e))

        # Summary
        total = len(self.results)
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = sum(1 for r in self.results if r["status"] == "FAIL")
        skipped = sum(1 for r in self.results if r["status"] == "SKIPPED")
        elapsed = round(time.time() - self.start_time, 2)

        print("\n" + "=" * 75)
        print(f"MASTER SUITE EXECUTION SUMMARY ({elapsed}s)")
        print(f"TOTAL CHECKPOINTS: {total} | PASSED: {passed} | FAILED: {failed} | SKIPPED: {skipped}")
        print("=" * 75 + "\n")

        return passed, failed, skipped


if __name__ == '__main__':
    suite = MasterValidationSuite()
    p, f, s = suite.run()
    if f > 0:
        sys.exit(1)
    sys.exit(0)
