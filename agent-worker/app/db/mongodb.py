from datetime import datetime
from typing import Union

from bson import ObjectId
from bson.errors import InvalidDocument, InvalidId
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError

from app.core.config import Config
from app.exceptions.mongodb import (
  AgentResultStoreFailed,
  MongoConfigError,
  MongoConnectionFailed,
  SessionChatsFetchFailed,
  SessionFetchFailed,
  SessionNotFound,
)
from app.schema.session import AgentResultRow, SessionRow
from app.schema.state import ApplyNodeOutput, ColdMailNodeOutput, CoverLetterNodeOutput, LinkedInNoteNodeOutput, ReviewNodeOutput

class DB:
  def __init__(self, config: Config):
    self._db = self._get_database(config.mongodb_uri, config.mongodb_name)
  
  def _get_mongo_connection(self, db_uri: str):
    if not db_uri:
      raise MongoConfigError("MongoDB URI is required")
    try:
      client = MongoClient(db_uri, serverSelectionTimeoutMS=5000)
      client.admin.command("ping")
      return client
    except PyMongoError as exc:
      raise MongoConnectionFailed(error=exc) from exc

  def _get_database(self, db_uri: str, db_name: str):
    if not db_name:
      raise MongoConfigError("MongoDB database name is required")
    return self._get_mongo_connection(db_uri)[db_name]

  def get_session_by_id(self, session_id: str) -> SessionRow:
    if not session_id:
      raise MongoConfigError("session_id is required")
    try:
      object_id = ObjectId(session_id)
    except (InvalidId, TypeError) as exc:
      raise SessionNotFound(session_id=session_id, error=exc) from exc

    session = self._db["sessions"]
    try:
      result = session.find_one({"_id": object_id})
    except PyMongoError as exc:
      raise SessionFetchFailed(error=exc) from exc
    if not result:
      raise SessionNotFound(session_id=session_id)
    result["_id"] = str(result["_id"])
    return SessionRow.model_validate(result)
  
  def get_session_chats(self, session_id: str):
    if not session_id:
      raise MongoConfigError("session_id is required")
    chat = self._db["chats"]
    try:
      chat.create_index([("session_id", DESCENDING)])
      return chat.find({"session_id": session_id})
    except PyMongoError as exc:
      raise SessionChatsFetchFailed(error=exc) from exc
  
  def store_agent_result(
      self,
      session_id: str,
      user_id: str,
      agent_output: Union[
        ReviewNodeOutput,
        ApplyNodeOutput,
        CoverLetterNodeOutput,
        LinkedInNoteNodeOutput,
        ColdMailNodeOutput
      ],
      jd_text: str = "",
      doc_key: str = "",
      user_query: str = ""
    ) -> AgentResultRow:
    if not session_id:
      raise MongoConfigError("session_id is required")
    if not user_id:
      raise MongoConfigError("user_id is required")
    chat = self._db["chats"]
    payload = {
      "session_id": session_id,
      "user_id": user_id,
      "jd_text": jd_text,
      "doc_key": doc_key,
      "user_query": user_query,
      "agent_result": agent_output.model_dump(mode="json"),
      "created_at": datetime.utcnow()
      }
    try:
      result = chat.insert_one(payload)
    except (PyMongoError, InvalidDocument) as exc:
      raise AgentResultStoreFailed(error=exc) from exc
    return AgentResultRow.model_validate({
      "_id": str(result.inserted_id),
      "user_id": user_id,
    })