import io
import os
import time
import uuid
from typing import Any

from .base import (
    BaseDocumentLoader,
    DocumentPage,
    DocumentRepresentation,
    DocumentSection,
)


class PDFLoader(BaseDocumentLoader):
    """Loader for PDF documents extracting text, page numbers, and structural flow."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext == '.pdf' or mime_type == 'application/pdf'

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        pages: list[DocumentPage] = []
        raw_text_parts: list[str] = []

        try:
            import pypdf
            if isinstance(file_path_or_bytes, (bytes, bytearray)):
                stream = io.BytesIO(file_path_or_bytes)
                reader = pypdf.PdfReader(stream)
                for idx, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    pages.append(DocumentPage(page_number=idx + 1, text=page_text))
                    raw_text_parts.append(page_text)
            elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
                with open(file_path_or_bytes, 'rb') as stream:
                    reader = pypdf.PdfReader(stream)
                    for idx, page in enumerate(reader.pages):
                        page_text = page.extract_text() or ""
                        pages.append(DocumentPage(page_number=idx + 1, text=page_text))
                        raw_text_parts.append(page_text)
        except ImportError:
            # Fallback if pypdf is not installed yet
            raw_text_parts.append(f"[PDF Document {filename} ingested - Install pypdf for binary parsing]")
            pages.append(DocumentPage(page_number=1, text=raw_text_parts[0]))
        except Exception as e:  # noqa: BLE001
            raw_text_parts.append(f"[PDF Extraction warning: {e!s}]")
            pages.append(DocumentPage(page_number=1, text=raw_text_parts[0]))

        full_text = "\n\n--- PAGE BREAK ---\n\n".join([p.text for p in pages]) if pages else "\n".join(raw_text_parts)

        # Build sections by pages
        sections = [
            DocumentSection(
                title=f"Page {p.page_number}",
                content=p.text,
                level=1
            )
            for p in pages if p.text.strip()
        ]

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="pdf",
            raw_text=full_text,
            sections=sections,
            headings=[s.title for s in sections[:10]],
            pages=pages,
            tables=[],
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "total_pages": len(pages),
                "file_size_bytes": len(full_text.encode('utf-8'))
            }
        )
