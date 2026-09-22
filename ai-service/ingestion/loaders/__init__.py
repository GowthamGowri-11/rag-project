from .base import (
    BaseDocumentLoader,
    DocumentPage,
    DocumentRepresentation,
    DocumentSection,
    DocumentTable,
)
from .code_loader import CodeLoader
from .docx_loader import DocxLoader
from .html_loader import HTMLLoader
from .markdown_loader import MarkdownLoader
from .pdf_loader import PDFLoader
from .structured_loader import StructuredLoader
from .text_loader import TextLoader

LOADERS: list[BaseDocumentLoader] = [
    MarkdownLoader(),
    PDFLoader(),
    DocxLoader(),
    HTMLLoader(),
    StructuredLoader(),
    CodeLoader(),
    TextLoader(), # Fallback
]

def get_loader_for_file(filename: str, mime_type: str | None = None) -> BaseDocumentLoader:
    for loader in LOADERS:
        if loader.supports(filename, mime_type):
            return loader
    return TextLoader()

def load_document(file_path_or_bytes, filename: str, domain: str, mime_type: str | None = None) -> DocumentRepresentation:
    loader = get_loader_for_file(filename, mime_type)
    return loader.load(file_path_or_bytes, filename, domain)

__all__ = [
    "BaseDocumentLoader",
    "CodeLoader",
    "DocumentPage",
    "DocumentRepresentation",
    "DocumentSection",
    "DocumentTable",
    "DocxLoader",
    "HTMLLoader",
    "MarkdownLoader",
    "PDFLoader",
    "StructuredLoader",
    "TextLoader",
    "get_loader_for_file",
    "load_document"
]
