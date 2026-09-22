import os
import sys
import unittest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from generation.evidence_checker.checker import EvidenceChecker
from ingestion.chunking.selector import AdaptiveChunkingSelector
from ingestion.document_analyzer.analyzer import DocumentAnalyzer
from ingestion.loaders import load_document
from retrieval.domain_router.router import DomainRouter
from retrieval.query_analyzer.analyzer import LightweightQueryAnalyzer
from retrieval.retrieval_router.router import RetrievalRouter


class TestAdaptiveRAGPipeline(unittest.TestCase):

    def setUp(self):
        self.analyzer = DocumentAnalyzer()
        self.chunk_selector = AdaptiveChunkingSelector()
        self.query_analyzer = LightweightQueryAnalyzer()
        self.domain_router = DomainRouter()
        self.retrieval_router = RetrievalRouter()
        self.evidence_checker = EvidenceChecker(threshold=0.55)

    def test_markdown_loader_and_analyzer(self):
        sample_md = """# Introduction to RAG
Retrieval-Augmented Generation combines parametric memory with external knowledge.

## Semantic Chunking
Semantic chunking splits text based on topic transitions rather than arbitrary character counts.

## Vector Search
BGE-M3 generates dense and sparse embeddings for Qdrant.
"""
        doc = load_document(sample_md.encode('utf-8'), "rag_guide.md", "rag")
        self.assertEqual(doc.document_type, "markdown")
        self.assertEqual(len(doc.headings), 3)

        profile = self.analyzer.analyze(doc)
        self.assertTrue(profile.has_deep_hierarchy)
        self.assertIn(profile.recommended_strategy, ["heading-aware", "section-aware", "paragraph-based"])

        _strategy, chunks, _meta = self.chunk_selector.chunk_document(doc, profile)
        self.assertGreaterEqual(len(chunks), 1)
        self.assertEqual(chunks[0].domain, "rag")

    def test_code_loader_and_analyzer(self):
        sample_code = """
def compute_embeddings(text):
    return [0.1, 0.2, 0.3]

class QdrantStore:
    def upsert(self, points):
        pass
"""
        doc = load_document(sample_code.encode('utf-8'), "engine.py", "code")
        self.assertEqual(doc.document_type, "code")
        profile = self.analyzer.analyze(doc)
        self.assertTrue(profile.is_code)
        self.assertEqual(profile.recommended_strategy, "code-aware")

    def test_query_analyzer_and_identifier(self):
        res = self.query_analyzer.analyze("What is the fix for CVE-2024-3094 in the code?", ["rag", "security"])
        self.assertEqual(res.intent, "exact_identifier_search")
        self.assertIn("CVE-2024-3094", res.exact_identifiers)
        self.assertEqual(res.detected_domain_hint, "security")

        # Test conceptual starter
        res_concept = self.query_analyzer.analyze("What is semantic chunking?", ["rag", "legal"])
        self.assertTrue(res_concept.is_conceptual)
        self.assertEqual(res_concept.detected_domain_hint, "rag")

    def test_retrieval_router_selection(self):
        # Exact identifier -> sparse
        res_id = self.query_analyzer.analyze("Check CVE-2024-1234 details")
        strat, _ = self.retrieval_router.select_strategy(res_id)
        self.assertEqual(strat, "sparse")

        # Comparison -> hybrid
        res_comp = self.query_analyzer.analyze("Compare dense vs sparse retrieval performance")
        strat_comp, _ = self.retrieval_router.select_strategy(res_comp)
        self.assertEqual(strat_comp, "hybrid")

        # Conceptual -> dense
        res_concept = self.query_analyzer.analyze("What is retrieval augmented generation?")
        strat_dense, _ = self.retrieval_router.select_strategy(res_concept)
        self.assertEqual(strat_dense, "dense")

    def test_evidence_gate_anti_hallucination(self):
        # Test 1: Empty chunks -> MUST FAIL
        gate_fail_empty = self.evidence_checker.check("What is quantum entanglement?", [])
        self.assertFalse(gate_fail_empty.is_sufficient)

        # Test 2: Low score below threshold -> MUST FAIL
        weak_chunk = [{
            "text": "The quick brown fox jumps over the lazy dog.",
            "rerank_score": 0.20,
            "retrieval_score": 0.15
        }]
        gate_fail_weak = self.evidence_checker.check("What is quantum entanglement?", weak_chunk)
        self.assertFalse(gate_fail_weak.is_sufficient)

        # Test 3: High score with relevant content -> MUST PASS
        strong_chunk = [{
            "text": "Quantum entanglement is a physical phenomenon that occurs when a group of particles interact.",
            "rerank_score": 0.88,
            "retrieval_score": 0.82
        }]
        gate_pass = self.evidence_checker.check("What is quantum entanglement?", strong_chunk)
        self.assertTrue(gate_pass.is_sufficient)

    def test_domain_isolation(self):
        # When asked about a domain that does not exist in available_domains
        analysis = self.query_analyzer.analyze("What does the legal clause 4.2 specify?")
        # Knowledge base only has 'rag'
        _target, is_valid, _reason = self.domain_router.route(
            analysis=analysis,
            available_domains=["rag"],
            domain_override="clinical"
        )
        # Explicit override to non-existent domain must be rejected
        self.assertFalse(is_valid)

if __name__ == '__main__':
    unittest.main()
