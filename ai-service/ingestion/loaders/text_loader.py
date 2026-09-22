import os
import time
import uuid
from typing import Any

from .base import BaseDocumentLoader, DocumentRepresentation, DocumentSection


class TextLoader(BaseDocumentLoader):
    """Loader for plain text files (.txt, .log, .text)"""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.txt', '.log', '.text']

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        if isinstance(file_path_or_bytes, (bytes, bytearray)):
            content = file_path_or_bytes.decode('utf-8', errors='replace')
        elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
            with open(file_path_or_bytes, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        else:
            content = str(file_path_or_bytes)

        # Break text into paragraphs as lightweight sections
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        sections = [
            DocumentSection(title=f"Section {idx+1}", content=p, level=1)
            for idx, p in enumerate(paragraphs)
        ]

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="txt",
            raw_text=content,
            sections=sections,
            headings=[s.title for s in sections[:5]],
            pages=[],
            tables=[],
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "file_size_bytes": len(content.encode('utf-8')),
                "format": "plain_text"
            }
        )
