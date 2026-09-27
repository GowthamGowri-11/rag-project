import re
from dataclasses import dataclass
from typing import Any, ClassVar


@dataclass
class QueryAnalysisResult:
    query: str
    intent: str  # 'factual_lookup', 'conceptual_explanation', 'cross_document_comparison', 'exact_identifier_search', 'troubleshooting', 'general'
    keywords: list[str]
    entities: list[str]
    exact_identifiers: list[str]
    is_conceptual: bool
    is_comparison: bool
    complexity: str  # 'low', 'medium', 'high'
    detected_domain_hint: str | None = None
    domain_confidence: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "query": self.query,
            "intent": self.intent,
            "keywords": self.keywords,
            "entities": self.entities,
            "exact_identifiers": self.exact_identifiers,
            "is_conceptual": self.is_conceptual,
            "is_comparison": self.is_comparison,
            "complexity": self.complexity,
            "detected_domain_hint": self.detected_domain_hint,
            "domain_confidence": round(self.domain_confidence, 2)
        }

class LightweightQueryAnalyzer:
    """Lightweight Python-based query analyzer.
    Extracts intent, keywords, entities, identifiers, and complexity without calling an LLM.
    """

    # Identifiers: CVEs, Sections, Articles, Codes, Model names, UUIDs
    IDENTIFIER_REGEXES: ClassVar[list[re.Pattern[str]]] = [
        re.compile(r'\b(?:CVE|cve)-\d{4}-\d{4,7}\b'),
        re.compile(r'\b(?:Section|Sec\.|Article|Clause)\s+\d+(?:\.\d+)*\b', re.IGNORECASE),
        re.compile(r'\b(?:RFC|ISO|IEEE|GDPR|HIPAA)[-\s]?\d+\b', re.IGNORECASE),
        re.compile(r'\b[A-Z0-9]{3,}(?:[-_][A-Z0-9]+)+\b'),
    ]

    COMPARISON_WORDS: ClassVar[set[str]] = {"compare", "contrast", "difference", "differences", "versus", "vs", "versus.", "differ", "better"}
    CONCEPTUAL_STARTERS: ClassVar[set[str]] = {"what is", "explain", "describe", "define", "concept of", "how does", "overview", "theory"}

    def analyze(self, query: str, known_domains: list[str] | None = None) -> QueryAnalysisResult:
        q_clean = query.strip()
        q_lower = q_clean.lower()

        # 1. Exact identifiers detection
        exact_identifiers: list[str] = []
        for pattern in self.IDENTIFIER_REGEXES:
            matches = pattern.findall(q_clean)
            exact_identifiers.extend(matches)

        # 2. Comparison detection
        words = re.findall(r'\b\w+\b', q_lower)
        is_comparison = any(w in self.COMPARISON_WORDS for w in words)

        # 3. Conceptual nature detection
        is_conceptual = any(q_lower.startswith(starter) for starter in self.CONCEPTUAL_STARTERS)

        # 4. Keywords extraction (filter stopwords)
        stopwords = {
            "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "for", "to",
            "of", "by", "with", "from", "as", "about", "what", "where", "how", "who", "does"
        }
        keywords = [w for w in words if w not in stopwords and len(w) > 2]

        # 5. Entity detection (capitalized words or specific terms)
        entities = [w for w in re.findall(r'\b[A-Z][a-zA-Z0-9_-]+\b', q_clean) if w.lower() not in stopwords]

        # 6. Intent classification
        if exact_identifiers:
            intent = "exact_identifier_search"
        elif is_comparison:
            intent = "cross_document_comparison"
        elif is_conceptual:
            intent = "conceptual_explanation"
        elif any(w in words for w in ["fix", "error", "issue", "bug", "troubleshoot", "fails"]):
            intent = "troubleshooting"
        elif len(words) <= 4:
            intent = "factual_lookup"
        else:
            intent = "general"

        # 7. Complexity
        if len(words) > 15 or (is_comparison and len(keywords) > 5):
            complexity = "high"
        elif len(words) > 6 or is_conceptual:
            complexity = "medium"
        else:
            complexity = "low"

        # 8. Domain hint detection against known domains
        domain_hint = None
        confidence = 0.0

        # Domain concept associations for common knowledge areas
        DOMAIN_ASSOCIATIONS = {
            "security": ["cve", "vulnerability", "patch", "exploit", "cwe", "security", "attack"],
            "legal": ["clause", "section", "act", "statute", "agreement", "regulation", "contract", "liability"],
            "clinical": ["patient", "clinical", "treatment", "protocol", "symptom", "diagnosis", "therapy", "dosage"],
            "rag": ["chunking", "retrieval", "embedding", "vector", "qdrant", "bge", "reranker", "rag", "generation"]
        }

        if known_domains:
            # Direct match
            for d in known_domains:
                d_clean = d.lower()
                if d_clean in q_lower:
                    domain_hint = d
                    confidence = 0.9
                    break

            # Semantic concept association match
            if not domain_hint:
                for d in known_domains:
                    d_clean = d.lower()
                    associations = DOMAIN_ASSOCIATIONS.get(d_clean, [])
                    if any(assoc in q_lower for assoc in associations):
                        domain_hint = d
                        confidence = 0.8
                        break

            # Keyword overlap fallback
            if not domain_hint:
                for d in known_domains:
                    d_tokens = d.lower().split()
                    matched = sum(1 for tok in d_tokens if tok in words)
                    if matched > 0:
                        domain_hint = d
                        confidence = 0.6
                        break

        return QueryAnalysisResult(
            query=q_clean,
            intent=intent,
            keywords=keywords,
            entities=entities,
            exact_identifiers=exact_identifiers,
            is_conceptual=is_conceptual,
            is_comparison=is_comparison,
            complexity=complexity,
            detected_domain_hint=domain_hint,
            domain_confidence=confidence
        )
