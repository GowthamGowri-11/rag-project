import io
import os
import time
import uuid
from typing import Any

from .base import (
    BaseDocumentLoader,
    DocumentRepresentation,
    DocumentSection,
    DocumentTable,
)


class DocxLoader(BaseDocumentLoader):
    """Loader for Microsoft Word (.docx) documents."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext == '.docx'

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        sections: list[DocumentSection] = []
        headings: list[str] = []
        tables: list[DocumentTable] = []
        raw_text_parts: list[str] = []

        try:
            import docx
            stream = None
            if isinstance(file_path_or_bytes, (bytes, bytearray)):
                stream = io.BytesIO(file_path_or_bytes)
            elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
                stream = file_path_or_bytes

            if stream:
                doc = docx.Document(stream)
                current_section_title = "Document Body"
                current_section_lines = []

                for p in doc.paragraphs:
                    text = p.text.strip()
                    if not text:
                        continue
                    raw_text_parts.append(text)
                    if p.style.name.startswith("Heading"):
                        if current_section_lines:
                            sections.append(DocumentSection(
                                title=current_section_title,
                                content="\n".join(current_section_lines),
                                level=1
                            ))
                            current_section_lines = []
                        current_section_title = text
                        headings.append(text)
                    else:
                        current_section_lines.append(text)

                if current_section_lines:
                    sections.append(DocumentSection(
                        title=current_section_title,
                        content="\n".join(current_section_lines),
                        level=1
                    ))

                # Extract tables
                for t_idx, table in enumerate(doc.tables):
                    headers = [cell.text.strip() for cell in table.rows[0].cells] if table.rows else []
                    rows = [
                        [cell.text.strip() for cell in row.cells]
                        for row in table.rows[1:]
                    ] if len(table.rows) > 1 else []
                    tables.append(DocumentTable(
                        headers=headers,
                        rows=rows,
                        caption=f"Table {t_idx + 1}"
                    ))
        except ImportError:
            raw_text_parts.append(f"[DOCX Document {filename} ingested - Install python-docx for native parsing]")
            sections.append(DocumentSection(title="Main", content=raw_text_parts[0], level=1))
        except Exception as e:  # noqa: BLE001
            raw_text_parts.append(f"[DOCX Extraction warning: {e!s}]")
            sections.append(DocumentSection(title="Error", content=raw_text_parts[0], level=1))

        full_text = "\n\n".join(raw_text_parts)

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="docx",
            raw_text=full_text,
            sections=sections,
            headings=headings,
            pages=[],
            tables=tables,
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "total_tables": len(tables),
                "file_size_bytes": len(full_text.encode('utf-8'))
            }
        )
