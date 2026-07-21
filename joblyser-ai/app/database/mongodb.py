import asyncio

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.exceptions.mongodb import (
  MongoConfigError,
  MongoConnectionFailed,
)


class MongoDB:
  def __init__(self, db_uri: str, db_name: str):
    if not db_uri:
      raise MongoConfigError("MongoDB URI is required")
    if not db_name:
      raise MongoConfigError("MongoDB database name is required")

    self._client = AsyncIOMotorClient(db_uri, serverSelectionTimeoutMS=5000)
    self._db: AsyncIOMotorDatabase = self._client[db_name]

  async def connect(self):
    try:
      await self._client.admin.command("ping")
    except Exception as err:
      self._client.close()
      raise MongoConnectionFailed(str(err)) from err

  async def close(self):
    self._client.close()

  @property
  def db(self) -> AsyncIOMotorDatabase:
    return self._db

  @property
  def sessions(self):
    return self.db["sessions"]

  @property
  def chats(self):
    return self.db["chats"]

  async def ping(self, timeout: float = 1.0) -> bool:
    try:
      await asyncio.wait_for(self._client.admin.command("ping"), timeout)
      return True
    except Exception:
      return False
