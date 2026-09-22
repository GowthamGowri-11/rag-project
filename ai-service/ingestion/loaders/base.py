from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class DocumentSection:
    title: str
    content: str
    level: int = 1

@dataclass
class DocumentPage:
    page_number: int
    text: str

@dataclass
class DocumentTable:
    headers: list[str]
    rows: list[list[str]]
    caption: str | None = None

@dataclass
class DocumentRepresentation:
    document_id: str
    filename: str
    document_type: str
    raw_text: str
    sections: list[DocumentSection] = field(default_factory=list)
    headings: list[str] = field(default_factory=list)
    pages: list[DocumentPage] = field(default_factory=list)
    tables: list[DocumentTable] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_id": self.document_id,
            "filename": self.filename,
            "document_type": self.document_type,
            "raw_text": self.raw_text,
            "sections": [{"title": s.title, "content": s.content, "level": s.level} for s in self.sections],
            "headings": self.headings,
            "pages": [{"page_number": p.page_number, "text": p.text} for p in self.pages],
            "tables": [{"headers": t.headers, "rows": t.rows, "caption": t.caption} for t in self.tables],
            "metadata": self.metadata
        }

class BaseDocumentLoader(ABC):
    """Abstract Base Class for all document format loaders."""

    @abstractmethod
    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        """Check if this loader supports the given file."""

    @abstractmethod
    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        """Parse the input file into a normalized DocumentRepresentation."""
