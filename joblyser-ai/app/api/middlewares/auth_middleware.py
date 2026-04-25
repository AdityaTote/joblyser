from collections.abc import Awaitable, Callable
from typing import Literal
from fastapi import Depends, HTTPException, Request, status
from psycopg import AsyncCursor
from pydantic import BaseModel
from jwt.exceptions import InvalidTokenError

from app.database.postgres import pg
from app.config.jwt import jwt, DepSvc

AllowedServices = Literal["worker", "api", "auth"]
AllowedServicesInput = AllowedServices | tuple[AllowedServices, ...]

class UserResponse(BaseModel):
  id: str

class UserReqResponse(BaseModel):
  id: str
  service: str

def _normalize_service_name(svc_raw: str | None) -> str | None:
  if not svc_raw:
    return None

  normalized = svc_raw.strip().lower()
  aliases = {
    "agent-worker": "worker",
    "worker": "worker",
    "joblyser-api": "api",
    "api": "api",
    "auth": "auth",
  }
  return aliases.get(normalized)

async def _get_user_by_id(user_id: str, db: AsyncCursor) -> UserResponse:
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

async def get_user(req: Request, db: AsyncCursor = Depends(pg.get_db)) -> UserReqResponse:
  auth_header = req.headers.get("Authorization")
  svc_hint = _normalize_service_name(req.headers.get("X-Service-Name"))

  if not auth_header or not auth_header.startswith("Bearer "):
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  if not svc_hint:
    svc_hint = "api"

  token = auth_header.removeprefix("Bearer ").strip()
  if not token:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  preferred_svc = DepSvc(svc_hint)

  try:
    decoded, verified_svc = jwt.verify_any(token=token, preferred_svc=preferred_svc)
  except (ValueError, InvalidTokenError) as e:
    print(f"Auth failed: token verification failed ({type(e).__name__}: {e})")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  if not decoded:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

  svc = verified_svc.value
  if svc_hint != svc:
    print(
      f"Auth debug: service header {svc_hint!r} does not match token issuer {svc!r}; issuer takes precedence"
    )
  
  raw_user_id = decoded.get("user_id") or decoded.get("uid")
  if not raw_user_id:
    print("Auth failed: token missing user id claim")
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
  
  user = await _get_user_by_id(raw_user_id, db)

  return UserReqResponse(id=user.id, service=svc)


def auth_middleware(allowed_services: AllowedServicesInput) -> Callable[..., Awaitable[UserResponse]]:
  resolved_allowed_services = (
    (allowed_services,)
    if isinstance(allowed_services, str)
    else allowed_services
  )

  async def middleware(user: UserReqResponse = Depends(get_user)) -> UserResponse:
    if user.service not in resolved_allowed_services:
      print(
        f"Auth failed: service {user.service!r} not in allowed services {resolved_allowed_services}"
      )
      raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return UserResponse(id=user.id)
  return middleware
