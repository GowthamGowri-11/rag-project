import logging

from ..query_analyzer.analyzer import QueryAnalysisResult

logger = logging.getLogger(__name__)

class DomainRouter:
    """Dynamically routes queries to active domains or rejects un-indexed domains."""

    def route(
        self,
        analysis: QueryAnalysisResult,
        available_domains: list[str],
        domain_override: str | None = None
    ) -> tuple[str | None, bool, str]:
        """
        Returns:
            target_domain: Name of the domain to query (or None)
            is_valid: True if domain exists and is indexed, False otherwise
            reason: Explanation of routing decision
        """
        # Normalize available domains to lowercase mapping
        domain_map = {d.lower(): d for d in available_domains}

        # 1. User specified explicit domain override
        if domain_override:
            clean_override = domain_override.strip().lower()
            if clean_override in domain_map:
                actual_name = domain_map[clean_override]
                return actual_name, True, f"Explicit domain '{actual_name}' selected by user."
            else:
                return None, False, f"Specified domain '{domain_override}' has not been uploaded or indexed."

        # 2. No domains uploaded at all
        if not available_domains:
            return None, False, "Knowledge base is completely empty. No domains have been indexed yet."

        # 3. Analyzer identified domain hint
        if analysis.detected_domain_hint:
            hint_lower = analysis.detected_domain_hint.lower()
            if hint_lower in domain_map:
                actual_name = domain_map[hint_lower]
                return actual_name, True, f"Detected domain '{actual_name}' from query intent."

        # 4. If only one single domain is indexed in the entire knowledge base
        if len(available_domains) == 1:
            single_domain = available_domains[0]
            return single_domain, True, f"Defaulting to active indexed domain '{single_domain}'."

        # 5. Check if query matches keywords in any known domain
        for d_key, original_d in domain_map.items():
            for kw in analysis.keywords:
                if kw in d_key or d_key in kw:
                    return original_d, True, f"Matched domain '{original_d}' via query keyword '{kw}'."

        # 6. Multi-domain ambiguity or unknown domain
        # If no domain matched, we allow broad retrieval across all available domains,
        # but if retrieved evidence from all domains fails the gate, it will be refused.
        return None, True, "No specific domain detected; querying across all indexed domains."
