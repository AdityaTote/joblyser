import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import Depends, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.dependencies import get_mongo, get_pg, get_vector_store
from app.config import config
from app.database.chroma import VectorStore
from app.database.mongodb import MongoDB
from app.database.postgres import Postgres
from app.api.rag.utils.doc_loader import DocumentLoader
from app.messaging.consumer import start_result_consumer
from app.s3.main import S3Client
from .routes import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
   mongo = MongoDB(db_uri=config.mongodb_uri, db_name=config.mongodb_name)
   pg = Postgres(db_host=config.postgres_host, db_name=config.postgres_name, db_password=config.postgres_password, db_port=config.postgres_port, db_user=config.postgres_user)
   vector_store = VectorStore(host=config.chroma_host, port=config.chroma_port, collection_name=config.chroma_collection, ssl=config.chroma_ssl)
   s3 = S3Client(bucket_name=config.aws_bucket, access_key=config.aws_access_key_id, secret_key=config.aws_secret_access_key, region=config.aws_region_name, cdn_url=config.aws_cloudfront_url, max_upload_size=config.s3_max_upload_size_mb)
   document_loader = DocumentLoader(s3=s3)
   consumer_task = None

   try:
      await mongo.connect()
      await pg.connect()
      app.state.mongo = mongo
      app.state.pg = pg
      app.state.vector_store = vector_store
      app.state.s3 = s3
      app.state.document_loader = document_loader
      consumer_task = asyncio.create_task(start_result_consumer())
      yield
   finally:
      try:
         if consumer_task is not None:
            consumer_task.cancel()
            with suppress(asyncio.CancelledError):
               await consumer_task
      finally:
         try:
            await pg.close()
         finally:
            await mongo.close()

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
async def ready(
   pg: Postgres = Depends(get_pg),
   mongo: MongoDB = Depends(get_mongo),
   vector_store: VectorStore = Depends(get_vector_store),
):
   mongo_ok = await mongo.ping()
   pg_ok = await pg.ping()
   chroma_ok = await asyncio.to_thread(vector_store.ping)

   if not (mongo_ok and pg_ok and chroma_ok):
       return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content={"status": "not_ready"})

   return { "status": "ready" }

app.include_router(router=api_router, prefix="/api/v1", tags=["api", "v1"])
