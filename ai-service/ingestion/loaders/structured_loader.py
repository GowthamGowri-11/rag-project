import csv
import io
import json
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


class StructuredLoader(BaseDocumentLoader):
    """Loader for structured data files (.csv, .json)."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in ['.csv', '.json']

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        if isinstance(file_path_or_bytes, (bytes, bytearray)):
            raw_content = file_path_or_bytes.decode('utf-8', errors='replace')
        elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
            with open(file_path_or_bytes, 'r', encoding='utf-8', errors='replace') as f:
                raw_content = f.read()
        else:
            raw_content = str(file_path_or_bytes)

        ext = os.path.splitext(filename)[1].lower()
        tables: list[DocumentTable] = []
        sections: list[DocumentSection] = []
        headings: list[str] = []

        if ext == '.csv':
            reader = csv.reader(io.StringIO(raw_content))
            rows = list(reader)
            headers = rows[0] if rows else []
            data_rows = rows[1:] if len(rows) > 1 else []
            tables.append(DocumentTable(headers=headers, rows=data_rows, caption=filename))
            headings.append(f"CSV Data: {filename}")

            # Generate textual representation per row/record
            row_summaries = []
            for idx, r in enumerate(data_rows[:200]): # bounded to first 200 rows for preview
                row_str = ", ".join([f"{h}: {val}" for h, val in zip(headers, r)])
                row_summaries.append(f"Record {idx+1}: {row_str}")

            clean_text = "\n".join(row_summaries)
            sections.append(DocumentSection(title="Tabular Records", content=clean_text, level=1))

        else: # .json
            try:
                parsed = json.loads(raw_content)
                clean_text = json.dumps(parsed, indent=2)
                if isinstance(parsed, list) and parsed and isinstance(parsed[0], dict):
                    headers = list(parsed[0].keys())
                    rows = [[str(item.get(h, "")) for h in headers] for item in parsed]
                    tables.append(DocumentTable(headers=headers, rows=rows, caption=filename))

                sections.append(DocumentSection(title="JSON Structure", content=clean_text, level=1))
                headings.append("JSON Root")
            except Exception:  # noqa: BLE001
                clean_text = raw_content
                sections.append(DocumentSection(title="Raw JSON", content=clean_text, level=1))

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="csv" if ext == '.csv' else "json",
            raw_text=clean_text,
            sections=sections,
            headings=headings,
            pages=[],
            tables=tables,
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "file_size_bytes": len(raw_content.encode('utf-8')),
                "is_structured": True
            }
        )
