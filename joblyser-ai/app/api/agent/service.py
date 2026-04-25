from datetime import datetime
from uuid import uuid4

from bson import ObjectId
from bson.errors import InvalidId
from psycopg import AsyncCursor

from app.messaging import producer, ProducerMessage, TaskParams
from app.database.mongodb import mongo
from .repository import JobRepository
from .exception import (
  AgentError,
  InvalidAgentRequest,
  JobCreateFailed,
  QueuePublishFailed,
  SessionCreateFailed,
)
from .schema import (
  AgentServiceParams,
  CreateJobParams,
  JobStatus,
  ChatsService,
  EditChatService,
  RunAgentResponse
)

class AgentService:
  _DEFAULT_USER_QUERY = "Analyze the provided job description and generate the requested output."

  @staticmethod
  async def _cleanup_session(session_id: str, user_id: str):
    try:
      await mongo.sessions.delete_one({"_id": ObjectId(session_id), "user_id": user_id})
    except Exception:
      pass

  @staticmethod
  def _parse_object_id(value: str, field_name: str) -> ObjectId:
    try:
      return ObjectId(value)
    except (InvalidId, TypeError) as error:
      raise AgentError(f"Invalid {field_name}", code="invalid_request", status_code=400) from error

  @staticmethod
  def _serialize_mongo_doc(document: dict):
    serialized = dict(document)
    if "_id" in serialized:
      serialized["id"] = str(serialized.pop("_id"))

    # Backward compatibility: older worker records used `create_at`.
    if "created_at" not in serialized and "create_at" in serialized:
      serialized["created_at"] = serialized.pop("create_at")

    return serialized

  @staticmethod
  async def _run_agent(input_data: AgentServiceParams, pg_db: AsyncCursor) -> RunAgentResponse:
    input_data.doc_key = input_data.doc_key.strip()
    input_data.jd_text = input_data.jd_text.strip()
    input_data.user_query = input_data.user_query.strip()

    if not input_data.doc_key:
      raise InvalidAgentRequest("Document key is required")
    if not input_data.jd_text:
      raise InvalidAgentRequest("Job description text is required")

    # Some clients submit an empty query; provide a deterministic default instead of failing.
    if not input_data.user_query:
      input_data.user_query = AgentService._DEFAULT_USER_QUERY

    created_session_id = None
    normalized_session_id = input_data.session_id.strip() if input_data.session_id else None

    if normalized_session_id:
      session_object_id = AgentService._parse_object_id(normalized_session_id, "session_id")
      try:
        existing_session = await mongo.sessions.find_one({
          "_id": session_object_id,
          "user_id": input_data.user_id,
        })
      except Exception as error:
        raise SessionCreateFailed("Failed to validate session") from error

      if existing_session is None:
        raise InvalidAgentRequest("Session not found")

      input_data.session_id = normalized_session_id
      input_data.jd_text = existing_session.get("jd_text", input_data.jd_text)
      input_data.doc_key = existing_session.get("doc_key", input_data.doc_key)
    else:
      try:
        session = await mongo.sessions.insert_one({"user_id": input_data.user_id,"created_at": datetime.utcnow() })
      except Exception as error:
        raise SessionCreateFailed() from error

      created_session_id = str(session.inserted_id)
      input_data.session_id = created_session_id

    try:
      job = await JobRepository.create(
        data=CreateJobParams(
          user_id=input_data.user_id,
          session_id=input_data.session_id,
          action=input_data.action,
          doc_key=input_data.doc_key,
          user_query=input_data.user_query,
          jd_text=input_data.jd_text,
          status=JobStatus.queued,
        ),
        db=pg_db,
      )
    except Exception as error:
      if created_session_id:
        await AgentService._cleanup_session(session_id=created_session_id, user_id=input_data.user_id)
      raise JobCreateFailed(message=f"Failed to create agent job: {error}") from error
      
    print("[before publish] Created job with id:", job.id)
    
    # Commit the transaction so the worker can find the job in the database.
    await pg_db.connection.commit()

    try:
      producer.publish(ProducerMessage(
        id=str(uuid4()),
        task=producer.tasks.AGENT,
        kwargs=TaskParams(
          job_id=job.id,
          session_id=input_data.session_id,
          user_id=input_data.user_id,
        ),
      ))
      print(f"Published job {job.id} to queue")
    except Exception as error:
      if created_session_id:
        await AgentService._cleanup_session(session_id=created_session_id, user_id=input_data.user_id)
      raise QueuePublishFailed() from error
    return RunAgentResponse(job_id=job.id, session_id=input_data.session_id, status=JobStatus.queued)

  @staticmethod
  async def run_agent_safe(input_data: AgentServiceParams, pg_db: AsyncCursor):
    try:
      return await AgentService._run_agent(input_data=input_data, pg_db=pg_db)
    except AgentError:
      raise
    except Exception as error:
      raise AgentError("Unexpected error while running agent") from error
    
  @staticmethod
  async def get_job_status(job_id: str, user_id: str, pg_db: AsyncCursor):
    try:
      job = await JobRepository.get_job_id(job_id=job_id, user_id=user_id, db=pg_db)
      return job
    except ValueError as error:
      raise AgentError("Job not found", status_code=404) from error
    except Exception as error:
      raise AgentError("Failed to get job status") from error
  
  @staticmethod
  async def get_sessions(limit: int, offset: int, user_id: str):
    try:
      sessions =  mongo.sessions.find({
        "user_id": user_id
      }).sort("created_at", -1).skip(offset).limit(limit)
      return [AgentService._serialize_mongo_doc(session) async for session in sessions]
    except Exception as error:
      raise AgentError("Failed to retrieve sessions", status_code=500) from error
  
  @staticmethod
  async def get_chats(input: ChatsService, pg_db: AsyncCursor):
    session_object_id = AgentService._parse_object_id(input.session_id, "session_id")

    if input.job_id is None:
      session = await mongo.sessions.find_one({
        "_id": session_object_id,
        "user_id": input.user_id
      })
      if session is None:
        raise AgentError("Session not found", status_code=404)
      
      chats = mongo.chats.find({
        "session_id": str(session["_id"]),
        "user_id": input.user_id
      }).sort("created_at", -1)
      return [AgentService._serialize_mongo_doc(chat) async for chat in chats]
    else:
      try:
        job = await JobRepository.get_job(job_id=input.job_id, db=pg_db)
      except ValueError as error:
        raise AgentError("Job not found", status_code=404) from error

      if job.user_id != input.user_id:
        raise AgentError("Job not found", status_code=404)

      if job.session_id != input.session_id:
        raise AgentError("Job does not belong to session", status_code=400)

      session = await mongo.sessions.find_one({
        "_id": session_object_id,
        "user_id": input.user_id
      })
      if session is None:
        raise AgentError("Session not found", status_code=404)

      if not job.chat_id:
        raise AgentError("Chat not found", status_code=404)

      chat_object_id = AgentService._parse_object_id(job.chat_id, "job chat id")

      chats = await mongo.chats.find_one({
        "_id": chat_object_id,
        "session_id": job.session_id,
        "user_id": input.user_id
      })
      if chats is None:
        raise AgentError("Chat not found", status_code=404)
      return [AgentService._serialize_mongo_doc(chats)]

  @staticmethod
  async def edit_chat(input: EditChatService):
    if not input.edited_text or not input.edited_text.strip():
      raise AgentError("edited_text is required", status_code=400)

    chat_object_id = AgentService._parse_object_id(input.chat_id, "chat_id")
    session_object_id = AgentService._parse_object_id(input.session_id, "session_id")

    session = await mongo.sessions.find_one({
      "_id": session_object_id,
      "user_id": input.user_id
    })
    if session is None:
      raise AgentError("Session not found", status_code=404)

    chat = await mongo.chats.find_one({
      "_id": chat_object_id,
      "session_id": input.session_id,
      "user_id": input.user_id
    })
    if chat is None:
      raise AgentError("Chat not found", status_code=404)

    action = (((chat.get("agent_result") or {}).get("type")) or "").strip()
    editable_actions = {
      "cover_letter",
      "linkedin_note",
      "cold_mail",
    }
    if action not in editable_actions:
      raise AgentError("This action output is not editable", status_code=400)

    await mongo.chats.update_one(
      {"_id": chat_object_id},
      {"$set": {"agent_result.edited_text": input.edited_text.strip(), "updated_at": datetime.utcnow()}},
    )

    updated_chat = await mongo.chats.find_one({"_id": chat_object_id})
    return AgentService._serialize_mongo_doc(updated_chat) if updated_chat else None
