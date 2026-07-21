from collections.abc import AsyncGenerator

from fastapi import Request
from psycopg import AsyncCursor

from app.database.mongodb import MongoDB
from app.database.postgres import Postgres
from app.database.chroma import VectorStore
from app.api.rag.utils.doc_loader import DocumentLoader
from app.s3.main import S3Client


def get_mongo(req: Request) -> MongoDB:
  return req.app.state.mongo

def get_pg(req: Request) -> Postgres:
  return req.app.state.pg


async def get_pg_db(req: Request) -> AsyncGenerator[AsyncCursor, None]:
  async for cursor in req.app.state.pg.get_db():
    yield cursor

def get_s3_store(req: Request) -> S3Client:
  return req.app.state.s3


def get_vector_store(req: Request) -> VectorStore:
  return req.app.state.vector_store


def get_document_loader(req: Request) -> DocumentLoader:
  return req.app.state.document_loader
