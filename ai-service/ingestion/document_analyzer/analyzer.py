import re
from dataclasses import dataclass, field
from typing import Any

from ..loaders.base import DocumentRepresentation


@dataclass
class DocumentProfile:
    document_id: str
    filename: str
    document_type: str
    character_count: int
    word_count: int
    paragraph_count: int
    heading_count: int
    table_count: int
    page_count: int
    code_snippet_density: float # 0.0 - 1.0
    text_density: float # words per paragraph/section
    has_deep_hierarchy: bool
    has_page_structure: bool
    is_tabular: bool
    is_code: bool
    recommended_strategy: str
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_id": self.document_id,
            "filename": self.filename,
            "document_type": self.document_type,
            "character_count": self.character_count,
            "word_count": self.word_count,
            "paragraph_count": self.paragraph_count,
            "heading_count": self.heading_count,
            "table_count": self.table_count,
            "page_count": self.page_count,
            "code_snippet_density": round(self.code_snippet_density, 3),
            "text_density": round(self.text_density, 2),
            "has_deep_hierarchy": self.has_deep_hierarchy,
            "has_page_structure": self.has_page_structure,
            "is_tabular": self.is_tabular,
            "is_code": self.is_code,
            "recommended_strategy": self.recommended_strategy
        }

class DocumentAnalyzer:
    """Analyzes document structural characteristics to guide the adaptive chunking selector."""

    def analyze(self, doc: DocumentRepresentation) -> DocumentProfile:
        text = doc.raw_text or ""
        char_count = len(text)
        words = text.split()
        word_count = len(words)

        paragraphs = [p for p in text.split("\n\n") if p.strip()]
        paragraph_count = max(len(paragraphs), 1)
        heading_count = len(doc.headings)
        table_count = len(doc.tables)
        page_count = len(doc.pages) if doc.pages else 0

        # Code density estimation
        code_lines = 0
        lines = text.splitlines()
        for line in lines:
            if re.search(r'[{}\[\];=><|]|function|def |class |import |from |return ', line):
                code_lines += 1
        code_density = code_lines / max(len(lines), 1)

        text_density = word_count / paragraph_count
        has_deep_hierarchy = heading_count >= 3
        has_page_structure = page_count > 1
        is_tabular = doc.document_type in ['csv', 'json'] or table_count > 0
        is_code = doc.document_type == 'code' or code_density > 0.45

        # Heuristic determination of initial recommended strategy
        if is_code:
            strategy = "code-aware"
        elif is_tabular:
            strategy = "table-aware"
        elif has_deep_hierarchy:
            strategy = "heading-aware" if len(doc.sections) > 1 else "section-aware"
        elif has_page_structure and page_count > 3:
            strategy = "page-aware"
        elif word_count > 3000:
            strategy = "recursive"
        elif paragraph_count > 5:
            strategy = "paragraph-based"
        else:
            strategy = "sentence-based"

        return DocumentProfile(
            document_id=doc.document_id,
            filename=doc.filename,
            document_type=doc.document_type,
            character_count=char_count,
            word_count=word_count,
            paragraph_count=paragraph_count,
            heading_count=heading_count,
            table_count=table_count,
            page_count=page_count,
            code_snippet_density=code_density,
            text_density=text_density,
            has_deep_hierarchy=has_deep_hierarchy,
            has_page_structure=has_page_structure,
            is_tabular=is_tabular,
            is_code=is_code,
            recommended_strategy=strategy
        )
