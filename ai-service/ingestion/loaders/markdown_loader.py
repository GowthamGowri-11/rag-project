import os
import re
import time
import uuid
from typing import Any

from .base import BaseDocumentLoader, DocumentRepresentation, DocumentSection


class MarkdownLoader(BaseDocumentLoader):
    """Loader for Markdown files (.md, .markdown), extracting headings and structured sections."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.md', '.markdown']

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        if isinstance(file_path_or_bytes, (bytes, bytearray)):
            content = file_path_or_bytes.decode('utf-8', errors='replace')
        elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
            with open(file_path_or_bytes, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        else:
            content = str(file_path_or_bytes)

        # Parse markdown headings and corresponding sections
        lines = content.splitlines()
        sections: list[DocumentSection] = []
        headings: list[str] = []

        current_title = "Introduction"
        current_level = 1
        current_lines: list[str] = []

        heading_pattern = re.compile(r'^(#{1,6})\s+(.*)$')

        for line in lines:
            match = heading_pattern.match(line)
            if match:
                if current_lines:
                    sections.append(DocumentSection(
                        title=current_title,
                        content="\n".join(current_lines).strip(),
                        level=current_level
                    ))
                    current_lines = []
                hashes, title = match.groups()
                current_level = len(hashes)
                current_title = title.strip()
                headings.append(current_title)
            else:
                current_lines.append(line)

        if current_lines:
            sections.append(DocumentSection(
                title=current_title,
                content="\n".join(current_lines).strip(),
                level=current_level
            ))

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="markdown",
            raw_text=content,
            sections=sections,
            headings=headings,
            pages=[],
            tables=[],
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "file_size_bytes": len(content.encode('utf-8')),
                "total_headings": len(headings)
            }
        )
