import asyncio
from typing import AsyncGenerator
from urllib.parse import quote_plus

import psycopg_pool
from psycopg import AsyncCursor

from app.config import config

class DB:
  def __init__(self, db_uri: str):
    self._pool = self._connect(db_uri=db_uri)

  def _connect(self, db_uri: str):
    return psycopg_pool.AsyncConnectionPool(
      conninfo=db_uri,
      min_size=1,
      max_size=10,
      open=False,
    )

  async def connect(self):
    if self._pool.closed:
      await self._pool.open(wait=True)

  async def close(self):
    if not self._pool.closed:
      await self._pool.close()

  def get_pool(self):
    return self._pool

  async def get_db(self) -> AsyncGenerator[AsyncCursor, None]:
    async with self._pool.connection() as conn:
      async with conn.cursor() as cur:
        yield cur
  
  async def ping(self, timeout: float = 1.0) -> bool:
    try:
      return await asyncio.wait_for(self._ping(), timeout)
    except Exception:
      return False

  async def _ping(self) -> bool:
    async with self._pool.connection() as conn:
      async with conn.cursor() as cur:
        await cur.execute("SELECT 1;")
        await cur.fetchone()
      return True

pg = DB(
  db_uri=(
    f"postgresql://{quote_plus(config.postgres_user)}:"
    f"{quote_plus(config.postgres_password)}@"
    f"{config.postgres_host}:{config.postgres_port}/{config.postgres_name}"
  )
)
