from enum import StrEnum
from typing import Optional

from pydantic import BaseModel

class JobStatus(StrEnum):
  completed = "COMPLETED"
  processing = "PROCESSING"
  queued = "QUEUED"
  pending = "PENDING"
  failed = "FAILED"

class ActionEnum(StrEnum):
	REVIEW = "review"
	GENERATE_APPLY_NOTE = "apply_note"
	GENERATE_COVER_LETTER = "cover_letter"
	GENERATE_LINKEDIN_NOTE = "linkedin_note"
	GENERATE_COLD_MAIL = "cold_mail"

class AgentRequest(BaseModel):
  action: ActionEnum
  user_query: str
  jd_text: str
  doc_key: str
  session_id: Optional[str] = None

class AgentServiceParams(AgentRequest):
  user_id: str

class CreateJobParams(BaseModel):
  action: ActionEnum
  user_id: str
  session_id: str
  doc_key: str
  user_query: str
  jd_text: str
  status: JobStatus

class JobStatusResponse(BaseModel):
  id: str
  status: str
  session_id: str
  chat_id: Optional[str] = None

class JobResponse(BaseModel):
  id: str
  status: str
  session_id: str
  user_id: str
  chat_id: Optional[str] = None

class ChatsService(BaseModel):
  session_id: str
  user_id: str
  job_id: Optional[str] = None

class EditChatRequest(BaseModel):
  session_id: str
  edited_text: str

class EditChatService(BaseModel):
  chat_id: str
  session_id: str
  user_id: str
  edited_text: str

class RunAgentResponse(BaseModel):
  job_id: str
  session_id: str
  status: JobStatus