import asyncio
from typing import AsyncGenerator
from urllib.parse import quote_plus

import psycopg_pool
from psycopg import AsyncCursor

class Postgres:
  def __init__(self, db_user: str, db_host: str, db_password: str, db_port: int, db_name: str):
    self._pool = self._connect(db_user, db_host, db_password, db_port, db_name)

  def _dsn(self, db_user: str, db_host: str, db_password: str, db_port: int, db_name: str):
    return f"postgresql://{quote_plus(db_user)}:{quote_plus(db_password)}@{db_host}:{db_port}/{db_name}"

  def _connect(self, db_user: str, db_host: str, db_password: str, db_port: int, db_name: str):
    db_uri = self._dsn(db_user=db_user, db_host=db_host, db_name=db_name, db_password=db_password, db_port=db_port)
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
