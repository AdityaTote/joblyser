from enum import Enum
from typing import Optional

from pydantic import BaseModel

class ContentType(str, Enum):
    PDF = "pdf"

class Metadata(BaseModel):
  file_name: Optional[str] = None
  file_size: Optional[int] = None
  source: Optional[str] = None
  content_type: Optional[ContentType] = None
  char_count: Optional[int] = None
  word_count: Optional[int] = None
  page: Optional[int] = None
  page_count: Optional[int] = None

class DocumentData(BaseModel):
  text: str
  metadata: Metadata

class RagStoreRequest(BaseModel):
  document_type: ContentType
  key: str

class RagStore(RagStoreRequest):
  user_id: str

class RagQueryRequest(BaseModel):
  document_type: ContentType
  user_query: str
  key: str

class RagQuery(RagQueryRequest):
  user_id: str
