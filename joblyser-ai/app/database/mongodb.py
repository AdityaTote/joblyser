import asyncio
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.exceptions.mongodb import (
  MongoConfigError,
  MongoConnectionFailed,
)
from app.config.main import config

class MongoDB:
  def __init__(self, db_uri: str, db_name: str):
    if not db_uri:
      raise MongoConfigError("MongoDB URI is required")
    if not db_name:
      raise MongoConfigError("MongoDB database name is required")

    self.db_uri = db_uri
    self._db_name = db_name

    self._client: Optional[AsyncIOMotorClient] = None
    self._db: Optional[AsyncIOMotorDatabase] = None

  async def connect(self):
    try:
      self._client = AsyncIOMotorClient(self.db_uri, serverSelectionTimeoutMS=5000,)
      self._db = self._client[self._db_name]
      await self._client.admin.command("ping")
    except Exception as err:
      raise MongoConnectionFailed(str(err))

  async def close(self):
    if self._client:
      self._client.close()

  @property
  def db(self) -> AsyncIOMotorDatabase:
    if self._db is None:
      raise RuntimeError("Database not initialized. Call connect() first.")
    return self._db

  @property
  def sessions(self):
    return self.db["sessions"]

  @property
  def chats(self):
    return self.db["chats"]
  
  async def ping(self, timeout: float = 1.0) -> bool:
    if not self._client:
      return False

    try:
      await asyncio.wait_for(self._client.admin.command("ping"), timeout)
      return True
    except Exception:
      return False
    

mongo = MongoDB(db_uri=config.mongodb_uri, db_name=config.mongodb_name)