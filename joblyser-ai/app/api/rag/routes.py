from fastapi import APIRouter, Depends, HTTPException, status

from app.api.middlewares.auth_middleware import auth_middleware, UserResponse
from app.api.schema.api_response import APIResponse
from .service import RagService
from .schema import RagStore, RagQuery, RagQueryRequest, RagStoreRequest
from .exception import RagError

rag_router = APIRouter(prefix="/rag", tags=["rag"])

@rag_router.post("/store", status_code=status.HTTP_201_CREATED, response_model=APIResponse)
async def store(input_data: RagStoreRequest, user: UserResponse = Depends(auth_middleware("api"))):
  try:
    params = RagStore(**input_data.model_dump(), user_id=user.id)
    await RagService.store(input_data=params)
  except RagError as error:
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
    message="document stored successfully",
  )

@rag_router.post("/retrieval", status_code=status.HTTP_200_OK, response_model=APIResponse)
async def query(input_data: RagQueryRequest, user: UserResponse = Depends(auth_middleware(("worker", "api", "auth")))):
  try:
    params = RagQuery(**input_data.model_dump(), user_id=user.id)
    data = await RagService.query(input_data=params)
  except RagError as error:
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
    message="retrieval successful",
    data=data,
  )