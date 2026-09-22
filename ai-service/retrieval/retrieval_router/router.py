from typing import Literal, cast

from ..query_analyzer.analyzer import QueryAnalysisResult

RetrievalMode = Literal["dense", "sparse", "hybrid"]

class RetrievalRouter:
    """Dynamically selects the optimal retrieval method based on query analysis.
    Avoids running unnecessary retrieval pipelines for every query.
    """

    def select_strategy(self, analysis: QueryAnalysisResult, override: str | None = None) -> tuple[RetrievalMode, str]:
        if override and override in ["dense", "sparse", "hybrid"]:
            return cast(RetrievalMode, override), f"Explicit strategy override: {override}"

        # 1. Exact identifiers (CVEs, RFCs, specific IDs) -> Sparse / Lexical
        if analysis.exact_identifiers or analysis.intent == "exact_identifier_search":
            return "sparse", "Selected sparse retrieval for exact identifier matching."

        # 2. Complex or comparative questions -> Hybrid (Dense + Lexical)
        if analysis.is_comparison or analysis.complexity == "high" or analysis.intent == "cross_document_comparison":
            return "hybrid", "Selected hybrid retrieval for complex cross-passage context."

        # 3. Conceptual or explanatory questions -> Dense Vector
        if analysis.is_conceptual or analysis.intent == "conceptual_explanation":
            return "dense", "Selected dense retrieval for semantic conceptual search."

        # 4. Troubleshooting / code queries -> Hybrid
        if analysis.intent == "troubleshooting":
            return "hybrid", "Selected hybrid retrieval for error code and symptom correlation."

        # 5. Default to dense for natural language
        return "dense", "Selected dense retrieval as standard semantic baseline."
