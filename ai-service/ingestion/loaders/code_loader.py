import os
import re
import time
import uuid
from typing import Any

from .base import BaseDocumentLoader, DocumentRepresentation, DocumentSection

CODE_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.c', '.cpp', '.h', '.hpp',
    '.cs', '.go', '.rs', '.php', '.rb', '.sh', '.sql', '.yaml', '.yml'
}

class CodeLoader(BaseDocumentLoader):
    """Loader for source code and script files."""

    def supports(self, filename: str, mime_type: str | None = None) -> bool:
        ext = os.path.splitext(filename)[1].lower()
        return ext in CODE_EXTENSIONS

    def load(self, file_path_or_bytes: Any, filename: str, domain: str, **kwargs) -> DocumentRepresentation:
        if isinstance(file_path_or_bytes, (bytes, bytearray)):
            raw_code = file_path_or_bytes.decode('utf-8', errors='replace')
        elif isinstance(file_path_or_bytes, str) and os.path.exists(file_path_or_bytes):
            with open(file_path_or_bytes, 'r', encoding='utf-8', errors='replace') as f:
                raw_code = f.read()
        else:
            raw_code = str(file_path_or_bytes)

        ext = os.path.splitext(filename)[1].lower()
        lines = raw_code.splitlines()

        sections: list[DocumentSection] = []
        headings: list[str] = []

        # Heuristic detection for functions/classes
        func_class_pattern = re.compile(r'^\s*(def |class |function |const \w+ = |async function |public class |private |fn )\s*([a-zA-Z0-9_]+)')
        current_block_name = "Global / Module Scope"
        current_block_lines = []

        for line in lines:
            match = func_class_pattern.match(line)
            if match:
                if current_block_lines:
                    sections.append(DocumentSection(
                        title=current_block_name,
                        content="\n".join(current_block_lines),
                        level=2
                    ))
                    current_block_lines = []
                kind, name = match.groups()
                current_block_name = f"{kind.strip()} {name}"
                headings.append(current_block_name)
            current_block_lines.append(line)

        if current_block_lines:
            sections.append(DocumentSection(
                title=current_block_name,
                content="\n".join(current_block_lines),
                level=2
            ))

        return DocumentRepresentation(
            document_id=f"doc_{uuid.uuid4().hex[:12]}",
            filename=filename,
            document_type="code",
            raw_text=raw_code,
            sections=sections,
            headings=headings,
            pages=[],
            tables=[],
            metadata={
                "domain": domain,
                "uploaded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "language": ext.lstrip('.'),
                "total_lines": len(lines),
                "file_size_bytes": len(raw_code.encode('utf-8'))
            }
        )
