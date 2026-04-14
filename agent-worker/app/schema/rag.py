from enum import Enum

from pydantic import BaseModel

class ContentType(str, Enum):
    PDF = "pdf"

class RagQuery(BaseModel):
  user_id: str
  document_type: ContentType
  user_query: str
  key: str
