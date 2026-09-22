from dataclasses import dataclass
from typing import Any


@dataclass
class EvidenceGateCheck:
    is_sufficient: bool
    confidence_score: float
    reason: str
    insufficient_response: str = "I don't have sufficient information about this topic in the available knowledge base."

class EvidenceChecker:
    """Strict Evidence Gate.
    Guarantees that Gemini is NEVER called when sufficient supporting evidence
    does not exist in the indexed knowledge base.
    """

    def __init__(self, threshold: float = 0.55):
        self.threshold = threshold

    def check(self, query: str, optimized_chunks: list[dict[str, Any]]) -> EvidenceGateCheck:
        # 1. Zero evidence check
        if not optimized_chunks:
            return EvidenceGateCheck(
                is_sufficient=False,
                confidence_score=0.0,
                reason="No candidate passages retrieved from the indexed knowledge base."
            )

        # 2. Score threshold check
        scores = [c.get("rerank_score", c.get("retrieval_score", 0.0)) for c in optimized_chunks]
        max_score = max(scores) if scores else 0.0

        if max_score < self.threshold:
            return EvidenceGateCheck(
                is_sufficient=False,
                confidence_score=round(max_score, 4),
                reason=f"Top candidate evidence score ({max_score:.2f}) is below the strict sufficiency threshold ({self.threshold:.2f})."
            )

        # 3. Term coverage check for explicit entities in query
        q_words = [w for w in query.lower().split() if len(w) > 3]
        combined_text = " ".join([c.get("text", "").lower() for c in optimized_chunks[:3]])
        matched_words = sum(1 for w in q_words if w in combined_text)
        coverage_ratio = matched_words / max(len(q_words), 1)

        if coverage_ratio < 0.25 and len(q_words) >= 3:
            return EvidenceGateCheck(
                is_sufficient=False,
                confidence_score=round(max_score, 4),
                reason=f"Evidence text lacks essential keyword coverage ({coverage_ratio:.1%}) for the query."
            )

        # Sufficient evidence confirmed
        return EvidenceGateCheck(
            is_sufficient=True,
            confidence_score=round(max_score, 4),
            reason="Retrieved evidence meets strict relevance and coverage criteria."
        )
