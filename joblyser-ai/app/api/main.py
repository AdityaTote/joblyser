from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

from app.database import mongodb, postgres
from app.database.chroma import ping_chroma
from .routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
   await mongodb.mongo.connect()
   await postgres.pg.connect()
   yield
   await mongodb.mongo.close()
   await postgres.pg.close()

app = FastAPI(lifespan=lifespan)

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