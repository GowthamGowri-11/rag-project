import os
import re
import time
import uuid
from typing import Any

from .base import (
    BaseDocumentLoader,
    DocumentRepresentation,
    DocumentSection,
    DocumentTable,
)


class HTMLLoader(BaseDocumentLoader):
    """Loader for HTML documents (.html, .htm), extracting headings, body text, and tables."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.html', '.htm'] or mime_type == 'text/html'

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        if isinstance(file_path_or_bytes, (bytes, bytearray)):
            raw_html = file_path_or_bytes.decode('utf-8', errors='replace')
        elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
            with open(file_path_or_bytes, 'r', encoding='utf-8', errors='replace') as f:
                raw_html = f.read()
        else:
            raw_html = str(file_path_or_bytes)

        sections: list[DocumentSection] = []
        headings: list[str] = []
        tables: list[DocumentTable] = []
        clean_text = ""

        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(raw_html, 'html.parser')

            # Extract title / headings
            for h in soup.find_all(re.compile(r'^h[1-6]$')):
                text = h.get_text(strip=True)
                if text:
                    headings.append(text)
                    sections.append(DocumentSection(
                        title=text,
                        content="",
                        level=int(h.name[1])
                    ))

            # Extract tables
            for idx, tbl in enumerate(soup.find_all('table')):
                headers = [th.get_text(strip=True) for th in tbl.find_all('th')]
                rows = []
                for tr in tbl.find_all('tr'):
                    tds = [td.get_text(strip=True) for td in tr.find_all('td')]
                    if tds:
                        rows.append(tds)
                if rows:
                    tables.append(DocumentTable(headers=headers, rows=rows, caption=f"Table {idx+1}"))

            # Remove scripts and styles
            for elem in soup(['script', 'style', 'header', 'footer', 'nav']):
                elem.decompose()
            clean_text = soup.get_text(separator="\n\n", strip=True)

        except ImportError:
            # Fallback regex-based cleaning
            clean_text = re.sub(r'<[^>]+>', ' ', raw_html)
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()

        if not sections:
            sections = [DocumentSection(title="Main Content", content=clean_text, level=1)]
        else:
            sections[0].content = clean_text

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="html",
            raw_text=clean_text,
            sections=sections,
            headings=headings,
            pages=[],
            tables=tables,
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "file_size_bytes": len(clean_text.encode('utf-8'))
            }
        )
