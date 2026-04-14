from fastapi import Depends, HTTPException, Request, status
from psycopg import AsyncCursor
from pydantic import BaseModel
from jwt.exceptions import InvalidTokenError
from uuid import UUID

from app.database.postgres import pg
from app.config.jwt import jwt, DepSvc

class UserResponse(BaseModel):
  id: str


def normalize_service_name(svc_raw: str | None) -> str | None:
  if not svc_raw:
    return None

  normalized = svc_raw.strip().lower()
  aliases = {
    "agent-worker": "worker",
    "worker": "worker",
    "joblyser-api": "api",
    "api": "api",
  }
  return aliases.get(normalized)

async def get_user(user_id: str, db: AsyncCursor) -> UserResponse:
  query = """
    SELECT id
    FROM users
    WHERE id = %s::uuid
  """
  await db.execute(query, (user_id,))
  user = await db.fetchone()
  if user is None:
    await db.execute("SELECT current_database(), current_user, inet_server_addr(), inet_server_port()")
    db_info = await db.fetchone()
    print(f"Auth debug: user lookup miss in db={db_info}")
    raise ValueError("user not found")
  data = UserResponse(id=str(user[0]))
  return data


async def authenticate_request(req: Request, db: AsyncCursor = Depends(pg.get_db)) -> UserResponse:
  auth_header = req.headers.get("Authorization")
  svc = normalize_service_name(req.headers.get("X-Service-Name"))

  if not auth_header or not svc or not auth_header.startswith("Bearer "):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  token = auth_header.removeprefix("Bearer ").strip()
  if not token:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  try:
    decoded = jwt.verify(token=token, svc=DepSvc(svc))
  except (ValueError, InvalidTokenError) as e:
    print(f"Auth failed: token verification failed ({type(e).__name__}: {e})")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  if not decoded:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  raw_user_id = decoded.get("user_id") or decoded.get("uid")
  if not raw_user_id:
    print("Auth failed: token missing user id claim")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  try:
    user_id = str(UUID(str(raw_user_id).strip()))
  except ValueError:
    print(f"Auth failed: invalid user_id format in token: {raw_user_id!r}")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  try:
    data = await get_user(user_id, db)
    print(f"Auth successful for user_id={data.id}")
    return data
  except ValueError:
    print(f"Auth failed: user not found for user_id={user_id}")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
