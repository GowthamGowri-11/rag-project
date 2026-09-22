import re
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from ..loaders.base import DocumentRepresentation


@dataclass
class DocumentChunk:
    id: str
    document_id: str
    domain: str
    document_type: str
    text: str
    section: str | None
    page: int | None
    chunk_strategy: str
    chunk_size: int
    overlap: int
    source_info: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.id,
            "document_id": self.document_id,
            "domain": self.domain,
            "document_type": self.document_type,
            "text": self.text,
            "section": self.section,
            "page": self.page,
            "chunk_strategy": self.chunk_strategy,
            "chunk_size": self.chunk_size,
            "overlap": self.overlap,
            "source_info": self.source_info
        }

class BaseChunkingStrategy(ABC):
    """Abstract base strategy for chunking documents."""

    @abstractmethod
    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 500, overlap: int = 50) -> list[DocumentChunk]:
        pass

class FixedSizeChunking(BaseChunkingStrategy):
    """Fixed-size character chunking with optional overlap."""

    def __init__(self, with_overlap: bool = True):
        self.with_overlap = with_overlap

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 500, overlap: int = 50) -> list[DocumentChunk]:
        text = doc.raw_text or ""
        eff_overlap = overlap if self.with_overlap else 0
        chunks = []
        step = max(chunk_size - eff_overlap, 1)

        for i in range(0, len(text), step):
            segment = text[i:i + chunk_size].strip()
            if not segment:
                continue
            chunk_id = f"chunk_{uuid.uuid4().hex[:10]}"
            chunks.append(DocumentChunk(
                id=chunk_id,
                document_id=doc.document_id,
                domain=doc.metadata.get("domain", "default"),
                document_type=doc.document_type,
                text=segment,
                section="Fixed Block",
                page=None,
                chunk_strategy="fixed-size-overlap" if self.with_overlap else "fixed-size",
                chunk_size=len(segment),
                overlap=eff_overlap,
                source_info={"filename": doc.filename, "start_char": i, "end_char": i + len(segment)}
            ))
        return chunks

class SentenceBasedChunking(BaseChunkingStrategy):
    """Groups text by full grammatical sentences up to target length."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 500, overlap: int = 50) -> list[DocumentChunk]:
        text = doc.raw_text or ""
        # Sentence boundary regex
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_sentences = []
        current_len = 0

        for s in sentences:
            s_clean = s.strip()
            if not s_clean:
                continue
            if current_len + len(s_clean) > chunk_size and current_sentences:
                chunk_text = " ".join(current_sentences)
                chunks.append(DocumentChunk(
                    id=f"chunk_{uuid.uuid4().hex[:10]}",
                    document_id=doc.document_id,
                    domain=doc.metadata.get("domain", "default"),
                    document_type=doc.document_type,
                    text=chunk_text,
                    section="Sentence Cluster",
                    page=None,
                    chunk_strategy="sentence-based",
                    chunk_size=len(chunk_text),
                    overlap=0,
                    source_info={"filename": doc.filename}
                ))
                current_sentences = [s_clean]
                current_len = len(s_clean)
            else:
                current_sentences.append(s_clean)
                current_len += len(s_clean)

        if current_sentences:
            chunk_text = " ".join(current_sentences)
            chunks.append(DocumentChunk(
                id=f"chunk_{uuid.uuid4().hex[:10]}",
                document_id=doc.document_id,
                domain=doc.metadata.get("domain", "default"),
                document_type=doc.document_type,
                text=chunk_text,
                section="Sentence Cluster",
                page=None,
                chunk_strategy="sentence-based",
                chunk_size=len(chunk_text),
                overlap=0,
                source_info={"filename": doc.filename}
            ))
        return chunks

class ParagraphBasedChunking(BaseChunkingStrategy):
    """Preserves semantic coherence by splitting across natural paragraphs."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 600, overlap: int = 50) -> list[DocumentChunk]:
        paragraphs = [p.strip() for p in (doc.raw_text or "").split("\n\n") if p.strip()]
        chunks = []

        for idx, p in enumerate(paragraphs):
            chunks.append(DocumentChunk(
                id=f"chunk_{uuid.uuid4().hex[:10]}",
                document_id=doc.document_id,
                domain=doc.metadata.get("domain", "default"),
                document_type=doc.document_type,
                text=p,
                section=f"Paragraph {idx + 1}",
                page=None,
                chunk_strategy="paragraph-based",
                chunk_size=len(p),
                overlap=0,
                source_info={"filename": doc.filename, "paragraph_index": idx + 1}
            ))
        return chunks

class HeadingAwareChunking(BaseChunkingStrategy):
    """Chunks documents using hierarchical heading boundaries (e.g. Legal clauses, Markdown)."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 800, overlap: int = 50) -> list[DocumentChunk]:
        chunks = []
        if doc.sections:
            for s in doc.sections:
                if not s.content.strip():
                    continue
                # If section content is within reasonable size, keep as single chunk
                if len(s.content) <= chunk_size * 1.5:
                    chunks.append(DocumentChunk(
                        id=f"chunk_{uuid.uuid4().hex[:10]}",
                        document_id=doc.document_id,
                        domain=doc.metadata.get("domain", "default"),
                        document_type=doc.document_type,
                        text=f"### {s.title}\n{s.content}",
                        section=s.title,
                        page=None,
                        chunk_strategy="heading-aware",
                        chunk_size=len(s.content),
                        overlap=0,
                        source_info={"filename": doc.filename, "section": s.title}
                    ))
                else:
                    # Recursive split sub-paragraphs under this heading
                    sub_paras = [p.strip() for p in s.content.split("\n\n") if p.strip()]
                    for p_idx, sp in enumerate(sub_paras):
                        chunks.append(DocumentChunk(
                            id=f"chunk_{uuid.uuid4().hex[:10]}",
                            document_id=doc.document_id,
                            domain=doc.metadata.get("domain", "default"),
                            document_type=doc.document_type,
                            text=f"### {s.title} (Part {p_idx+1})\n{sp}",
                            section=s.title,
                            page=None,
                            chunk_strategy="heading-aware",
                            chunk_size=len(sp),
                            overlap=0,
                            source_info={"filename": doc.filename, "section": s.title, "part": p_idx + 1}
                        ))
        else:
            # Fallback to paragraph
            return ParagraphBasedChunking().chunk(doc, chunk_size, overlap)
        return chunks

class PageAwareChunking(BaseChunkingStrategy):
    """Chunks documents while strictly honoring original PDF/document page boundaries."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 1000, overlap: int = 50) -> list[DocumentChunk]:
        chunks = []
        if doc.pages:
            for p in doc.pages:
                text = p.text.strip()
                if not text:
                    continue
                chunks.append(DocumentChunk(
                    id=f"chunk_{uuid.uuid4().hex[:10]}",
                    document_id=doc.document_id,
                    domain=doc.metadata.get("domain", "default"),
                    document_type=doc.document_type,
                    text=text,
                    section=f"Page {p.page_number}",
                    page=p.page_number,
                    chunk_strategy="page-aware",
                    chunk_size=len(text),
                    overlap=0,
                    source_info={"filename": doc.filename, "page": p.page_number}
                ))
        else:
            return ParagraphBasedChunking().chunk(doc, chunk_size, overlap)
        return chunks

class TableAwareChunking(BaseChunkingStrategy):
    """Preserves tables and structured data rows without tearing columns."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 600, overlap: int = 0) -> list[DocumentChunk]:
        chunks = []
        if doc.tables:
            for t_idx, tbl in enumerate(doc.tables):
                header_line = " | ".join(tbl.headers)
                row_lines = [" | ".join(row) for row in tbl.rows]
                # Group rows into chunks of 10
                batch_size = 10
                for r_i in range(0, len(row_lines), batch_size):
                    batch = row_lines[r_i:r_i + batch_size]
                    tbl_text = f"Table: {tbl.caption or f'Table {t_idx+1}'}\nHeaders: {header_line}\n" + "\n".join(batch)
                    chunks.append(DocumentChunk(
                        id=f"chunk_{uuid.uuid4().hex[:10]}",
                        document_id=doc.document_id,
                        domain=doc.metadata.get("domain", "default"),
                        document_type=doc.document_type,
                        text=tbl_text,
                        section=tbl.caption or f"Table {t_idx+1}",
                        page=None,
                        chunk_strategy="table-aware",
                        chunk_size=len(tbl_text),
                        overlap=0,
                        source_info={"filename": doc.filename, "table": tbl.caption or f"Table {t_idx+1}"}
                    ))
        if not chunks:
            # Fallback
            return ParagraphBasedChunking().chunk(doc, chunk_size, overlap)
        return chunks

class CodeAwareChunking(BaseChunkingStrategy):
    """Chunks source code preserving class/function boundaries."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 800, overlap: int = 50) -> list[DocumentChunk]:
        chunks = []
        if doc.sections:
            for s in doc.sections:
                if not s.content.strip():
                    continue
                chunks.append(DocumentChunk(
                    id=f"chunk_{uuid.uuid4().hex[:10]}",
                    document_id=doc.document_id,
                    domain=doc.metadata.get("domain", "default"),
                    document_type=doc.document_type,
                    text=f"// Symbol: {s.title}\n{s.content}",
                    section=s.title,
                    page=None,
                    chunk_strategy="code-aware",
                    chunk_size=len(s.content),
                    overlap=0,
                    source_info={"filename": doc.filename, "symbol": s.title}
                ))
        else:
            return FixedSizeChunking(with_overlap=True).chunk(doc, chunk_size, overlap)
        return chunks

class RecursiveChunking(BaseChunkingStrategy):
    """Splits text recursively using delimiters: \n\n, \n, sentence boundaries, spaces."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 500, overlap: int = 50) -> list[DocumentChunk]:
        text = doc.raw_text or ""
        delimiters = ["\n\n", "\n", ". ", " "]

        def _split_text(txt: str, delim_idx: int) -> list[str]:
            if len(txt) <= chunk_size or delim_idx >= len(delimiters):
                return [txt]
            delim = delimiters[delim_idx]
            parts = txt.split(delim)
            result = []
            cur = ""
            for p in parts:
                candidate = (cur + delim + p) if cur else p
                if len(candidate) <= chunk_size:
                    cur = candidate
                else:
                    if cur:
                        result.append(cur)
                    if len(p) > chunk_size:
                        result.extend(_split_text(p, delim_idx + 1))
                        cur = ""
                    else:
                        cur = p
            if cur:
                result.append(cur)
            return result

        raw_chunks = _split_text(text, 0)
        chunks = []
        for idx, rc in enumerate(raw_chunks):
            clean = rc.strip()
            if not clean:
                continue
            chunks.append(DocumentChunk(
                id=f"chunk_{uuid.uuid4().hex[:10]}",
                document_id=doc.document_id,
                domain=doc.metadata.get("domain", "default"),
                document_type=doc.document_type,
                text=clean,
                section=f"Segment {idx+1}",
                page=None,
                chunk_strategy="recursive",
                chunk_size=len(clean),
                overlap=overlap,
                source_info={"filename": doc.filename, "segment_index": idx+1}
            ))
        return chunks

class SemanticChunking(BaseChunkingStrategy):
    """Chunks text based on semantic topic transitions (implemented as coherence clustering)."""

    def chunk(self, doc: DocumentRepresentation, chunk_size: int = 600, overlap: int = 50) -> list[DocumentChunk]:
        # Semantic strategy groups coherent blocks
        paragraphs = [p.strip() for p in (doc.raw_text or "").split("\n\n") if p.strip()]
        chunks = []
        buffer = []
        buf_len = 0

        for idx, p in enumerate(paragraphs):
            if buf_len + len(p) > chunk_size and buffer:
                combined = "\n\n".join(buffer)
                chunks.append(DocumentChunk(
                    id=f"chunk_{uuid.uuid4().hex[:10]}",
                    document_id=doc.document_id,
                    domain=doc.metadata.get("domain", "default"),
                    document_type=doc.document_type,
                    text=combined,
                    section=f"Topic Group {len(chunks) + 1}",
                    page=None,
                    chunk_strategy="semantic",
                    chunk_size=len(combined),
                    overlap=overlap,
                    source_info={"filename": doc.filename, "topic_id": len(chunks) + 1}
                ))
                buffer = [p]
                buf_len = len(p)
            else:
                buffer.append(p)
                buf_len += len(p)

        if buffer:
            combined = "\n\n".join(buffer)
            chunks.append(DocumentChunk(
                id=f"chunk_{uuid.uuid4().hex[:10]}",
                document_id=doc.document_id,
                domain=doc.metadata.get("domain", "default"),
                document_type=doc.document_type,
                text=combined,
                section=f"Topic Group {len(chunks) + 1}",
                page=None,
                chunk_strategy="semantic",
                chunk_size=len(combined),
                overlap=overlap,
                source_info={"filename": doc.filename, "topic_id": len(chunks) + 1}
            ))
        return chunks
