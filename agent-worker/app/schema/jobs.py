from enum import StrEnum

from pydantic import BaseModel

from .state import ActionEnum

class JobStatus(StrEnum):
  completed = "COMPLETED"
  processing = "PROCESSING"
  queued = "QUEUED"
  pending = "PENDING"
  failed = "FAILED"

class JobRow(BaseModel):
  id: str
  user_id: str
  session_id: str
  action: ActionEnum
  doc_key: str
  user_query: str
  jd_text: str
  status: str