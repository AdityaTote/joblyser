from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import AsyncCursor

from app.api.middlewares.request_middleware import authenticate_request, UserResponse
from app.api.schema.api_response import APIResponse
from app.database.postgres import pg
from .exception import AgentError
from .schema import AgentRequest, AgentServiceParams, EditChatRequest, EditChatService
from .service import AgentService, ChatsService

agent_router = APIRouter(prefix="/agent", tags=["agent"])

@agent_router.post("/run", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def run_agent(input_data: AgentRequest, pg_db: AsyncCursor = Depends(pg.get_db), user: UserResponse = Depends(authenticate_request)):
  try:
    service_params = AgentServiceParams(**input_data.model_dump(), user_id=user.id)
    data = await AgentService.run_agent_safe(service_params, pg_db)
  except AgentError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={
        "success": False,
        "message": error.message,
        "data": {"code": error.code},
      },
    ) from error
  except Exception as error:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail={
        "success": False,
        "message": "Internal server error",
        "data": {
          "code": "internal_server_error",
          "error": str(error),
        },
      },
    ) from error

  return APIResponse(
    success=True,
    message="agent job created and processing started",
    data=data
  )

@agent_router.get("/status/{job_id}", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def get_agent_job_status(job_id: str, pg_db: AsyncCursor = Depends(pg.get_db), user: UserResponse = Depends(authenticate_request)):
  try:
    data = await AgentService.get_job_status(job_id=job_id, user_id=user.id, pg_db=pg_db)
  except AgentError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={
        "success": False,
        "message": error.message,
        "data": {"code": error.code},
      },
    ) from error
  except Exception as error:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail={
        "success": False,
        "message": "Internal server error",
        "data": {
          "code": "internal_server_error",
          "error": str(error),
        },
      },
    ) from error

  return APIResponse(
    success=True,
    message="agent job status retrieved successfully",
    data=data
  )

@agent_router.get("/sessions", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def get_sessions(limit: int = 5, offset: int = 0, user: UserResponse = Depends(authenticate_request)):
  try:
    sessions = await AgentService.get_sessions(limit=limit, offset=offset, user_id=user.id)
  except AgentError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={
        "success": False,
        "message": error.message,
        "data": {"code": error.code},
      },
    ) from error
  except Exception as error:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail={
        "success": False,
        "message": "Internal server error",
        "data": {
          "code": "internal_server_error",
          "error": str(error),
        },
      },
    ) from error

  return APIResponse(
    success=True,
    message="sessions retrieved successfully",
    data=sessions
  )

@agent_router.get("/sessions/{session_id}", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def get_session_chat(session_id: str, job_id: Optional[str] = None, pg_db: AsyncCursor = Depends(pg.get_db), user: UserResponse = Depends(authenticate_request)):
  try:
    params = ChatsService(session_id=session_id, user_id=user.id)
    if job_id:
      params.job_id = job_id
    chats = await AgentService.get_chats(params, pg_db=pg_db)
  except AgentError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={
        "success": False,
        "message": error.message,
        "data": {"code": error.code},
      },
    ) from error
  except Exception as error:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail={
        "success": False,
        "message": "Internal server error",
        "data": {
          "code": "internal_server_error",
          "error": str(error),
        },
      },
    ) from error

  return APIResponse(
    success=True,
    message="session chats retrieved successfully",
    data=chats
  )

@agent_router.patch("/chats/{chat_id}/edit", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def edit_session_chat(chat_id: str, input_data: EditChatRequest, user: UserResponse = Depends(authenticate_request)):
  try:
    params = EditChatService(
      chat_id=chat_id,
      session_id=input_data.session_id,
      user_id=user.id,
      edited_text=input_data.edited_text,
    )
    chat = await AgentService.edit_chat(params)
  except AgentError as error:
    raise HTTPException(
      status_code=error.status_code,
      detail={
        "success": False,
        "message": error.message,
        "data": {"code": error.code},
      },
    ) from error
  except Exception as error:
    raise HTTPException(
      status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
      detail={
        "success": False,
        "message": "Internal server error",
        "data": {
          "code": "internal_server_error",
          "error": str(error),
        },
      },
    ) from error

  return APIResponse(
    success=True,
    message="chat updated successfully",
    data=chat
  )