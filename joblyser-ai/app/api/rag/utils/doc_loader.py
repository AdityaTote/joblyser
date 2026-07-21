import os
from typing import Callable

import fitz
from langchain_core.documents import Document

from ..schema import ContentType, DocumentData, Metadata
from app.s3.main import S3Client

EXTENSION_MAP: dict[str, str] = {
    ".pdf": "pdf",
}

class DocumentLoader:
  def __init__(
    self,
    s3: S3Client,
  ):
    self._s3 = s3
    self._extractor: dict[ContentType, Callable[[bytes, Metadata], list[DocumentData]]] = {
      ContentType.PDF: self._extract_pdf,
    }

  def load(self, key: str) -> list[Document]:
    content_type = self._extract_type(key)
    file = self._download(key)

    metadata = Metadata(
      file_name=os.path.basename(key),
      source=key,
      file_size=len(file),
      content_type=content_type,
      page_count=None
    )

    extractor = self._extractor.get(content_type)

    if not extractor:
      raise ValueError(f"No extractor for content type: {content_type}")

    extracted_docs = extractor(file, metadata)

    docs: list[Document] = []
    for item in extracted_docs:
      docs.append(Document(
        page_content=item.text,
        metadata = {**item.metadata.model_dump()}
      ))

    return docs

  def _download(self, key: str) -> bytes:
    return self._s3.download_file(key)

  def _extract_type(self, key: str) -> ContentType:
    for ext, content_type in EXTENSION_MAP.items():
      if key.lower().endswith(ext):
        return ContentType(content_type)
    raise ValueError(f"Unsupported file type for key: {key}")

  def _extract_pdf(self, data: bytes, metadata: Metadata) -> list[DocumentData]:
    pages: list[DocumentData] = []
    filetype = metadata.content_type.value if metadata.content_type else "pdf"
    with fitz.open(stream=data, filetype=filetype) as doc:
      metadata.page_count = len(doc)
      for page_idx in range(metadata.page_count):
        page = doc.load_page(page_idx)
        text = str(page.get_text("text"))
        page_metadata = Metadata(
          file_name = metadata.file_name,
          page_count=metadata.page_count,
          page= page_idx + 1,
          source=metadata.source,
          char_count=len(text),
          word_count=len(text.split()),
          content_type=metadata.content_type,
          file_size=metadata.file_size
        )
        pages.append(DocumentData(text=text, metadata=page_metadata))
    return pages
