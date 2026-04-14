from fastapi import APIRouter

from .agent.routes import agent_router
from .rag.routes import rag_router

api_router = APIRouter()

api_router.include_router(router=rag_router)
api_router.include_router(router=agent_router)