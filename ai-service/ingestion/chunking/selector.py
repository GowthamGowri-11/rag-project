from typing import Any, ClassVar

from ..document_analyzer.analyzer import DocumentProfile
from ..loaders.base import DocumentRepresentation
from .strategies import (
    BaseChunkingStrategy,
    CodeAwareChunking,
    DocumentChunk,
    FixedSizeChunking,
    HeadingAwareChunking,
    PageAwareChunking,
    ParagraphBasedChunking,
    RecursiveChunking,
    SemanticChunking,
    SentenceBasedChunking,
    TableAwareChunking,
)


class AdaptiveChunkingSelector:
    """Selects and executes the most optimal chunking strategy based on the document profile."""

    STRATEGIES: ClassVar[dict[str, BaseChunkingStrategy]] = {
        "fixed-size": FixedSizeChunking(with_overlap=False),
        "fixed-size-overlap": FixedSizeChunking(with_overlap=True),
        "sentence-based": SentenceBasedChunking(),
        "paragraph-based": ParagraphBasedChunking(),
        "heading-aware": HeadingAwareChunking(),
        "section-aware": HeadingAwareChunking(),
        "page-aware": PageAwareChunking(),
        "table-aware": TableAwareChunking(),
        "code-aware": CodeAwareChunking(),
        "recursive": RecursiveChunking(),
        "semantic": SemanticChunking(),
    }

    def select_strategy(self, profile: DocumentProfile) -> tuple[str, BaseChunkingStrategy, dict[str, int]]:
        """Determine chunking strategy, chunk size, and overlap parameters."""
        strategy_name = profile.recommended_strategy

        # Adaptive parameters tuning
        if profile.is_code:
            config = {"chunk_size": 800, "overlap": 50}
        elif profile.is_tabular:
            config = {"chunk_size": 500, "overlap": 0}
        elif profile.has_deep_hierarchy:
            config = {"chunk_size": 700, "overlap": 60}
        elif profile.has_page_structure:
            config = {"chunk_size": 900, "overlap": 50}
        elif profile.word_count > 5000:
            config = {"chunk_size": 600, "overlap": 80}
        else:
            config = {"chunk_size": 450, "overlap": 40}

        strategy = self.STRATEGIES.get(strategy_name, self.STRATEGIES["paragraph-based"])
        return strategy_name, strategy, config

    def chunk_document(self, doc: DocumentRepresentation, profile: DocumentProfile) -> tuple[str, list[DocumentChunk], dict[str, Any]]:
        strategy_name, strategy, config = self.select_strategy(profile)
        chunks = strategy.chunk(doc, chunk_size=config["chunk_size"], overlap=config["overlap"])

        metadata = {
            "strategy_used": strategy_name,
            "chunk_count": len(chunks),
            "chunk_size": config["chunk_size"],
            "overlap": config["overlap"]
        }
        return strategy_name, chunks, metadata
