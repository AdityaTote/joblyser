import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import config
from app.database import mongodb, postgres
from app.database.chroma import ping_chroma
from app.messaging.consumer import start_result_consumer
from .routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
   await mongodb.mongo.connect()
   await postgres.pg.connect()
   asyncio.create_task(start_result_consumer())
   yield
   await mongodb.mongo.close()
   await postgres.pg.close()

app = FastAPI(lifespan=lifespan)

allowed_origins = [origin.strip() for origin in config.cors_allowed_origins.split(",") if origin.strip()]

app.add_middleware(
   CORSMiddleware,
   allow_origins=allowed_origins,
   allow_credentials=True,
   allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
   allow_headers=["Accept", "Authorization", "Content-Type", "X-Service-Name"],
)

@app.get("/health", status_code=status.HTTP_200_OK)
@app.get("/heathy", status_code=status.HTTP_200_OK)
def health():
   return { "health": "ok" }

@app.get("/ready", status_code=status.HTTP_200_OK)
async def ready():
   mongo_ok = await mongodb.mongo.ping()
   pg_ok = await postgres.pg.ping()
   chroma_ok = ping_chroma()

   if not (mongo_ok and pg_ok and chroma_ok):
       return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"status": "not_ready"})

   return { "status": "ready" }

app.include_router(router=api_router, prefix="/api/v1", tags=["api", "v1"])