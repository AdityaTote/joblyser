from datetime import datetime, timezone

from chromadb import Metadata

from app.database.chroma import get_vector_store
from app.api.rag.exception import (
  DocumentLoadFailed,
  EmbeddingGenerationFailed,
  RetrievalFailed,
  VectorStoreUnavailable,
  VectorStoreWriteFailed,
)
from .doc_loader import document_loader
from .embedding import embed
from ..schema import RagQuery, RagStore

class Rag:
  @staticmethod
  async def store(input: RagStore):
    try:
      vector_store = get_vector_store()
    except Exception as error:
      raise VectorStoreUnavailable() from error

    try:
      docs = document_loader.load(input.key)
    except Exception as error:
      raise DocumentLoadFailed(f"Unable to load document: {input.key}") from error

    chunks = embed.chunks_doc(docs)

    documents = [chunk.page_content for chunk in chunks] if chunks else []

    try:
      embeddings = embed.generate_embeddings(documents)
    except Exception as error:
      raise EmbeddingGenerationFailed() from error

    metadatas: list[Metadata] = []
    for i, chunk in enumerate(chunks, 0):
      content_type = chunk.metadata.get("content_type")
      normalized_content_type = (
        content_type.value
        if content_type is not None and hasattr(content_type, "value")
        else input.document_type.value
      )

      chunk_metadata: Metadata = {
        "doc_key": input.key,
        "user_id": input.user_id,
        "chunk_index": i,
        "key": input.key,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "doc_type": input.document_type.value,
        "content_type": normalized_content_type,
      }

      source = chunk.metadata.get("source")
      file_name = chunk.metadata.get("file_name")
      page = chunk.metadata.get("page")
      page_count = chunk.metadata.get("page_count")

      if source is not None:
        chunk_metadata["source"] = source
      if file_name is not None:
        chunk_metadata["file_name"] = file_name
      if page is not None:
        chunk_metadata["page"] = page
      if page_count is not None:
        chunk_metadata["page_count"] = page_count

      metadatas.append(chunk_metadata)

    ids = [f"{input.key}:{i}" for i in range(len(chunks))]

    try:
      vector_store.add_embedding(
        ids=ids,
        chunks=documents,
        embeddings=embeddings,
        metadata=metadatas
      )
    except Exception as error:
      raise VectorStoreWriteFailed() from error
    return True

  @staticmethod
  async def query(input: RagQuery):
    try:
      vector_store = get_vector_store()
    except Exception as error:
      raise VectorStoreUnavailable() from error

    try:
      embed_query = embed.generate_embeddings([input.user_query])
    except Exception as error:
      raise EmbeddingGenerationFailed("Failed to generate query embedding") from error

    where_candidates: list[dict] = []

    def build_and_filter(criteria: dict[str, str | None]) -> dict:
      active_filters = [
        {field: value}
        for field, value in criteria.items()
        if value is not None
      ]
      if not active_filters:
        return {}
      if len(active_filters) == 1:
        return active_filters[0]
      return {"$and": active_filters}

    for criteria in [
        {
          "doc_key": input.key,
          "user_id": input.user_id,
          "key": input.key,
          "doc_type": input.document_type.value,
        },
        {
          "doc_key": input.key,
          "user_id": input.user_id,
          "doc_type": input.document_type.value,
        },
        {
          "doc_key": input.key,
          "user_id": input.user_id,
        },
        {
          "doc_id": input.key,
        },
    ]:
        where_filter = build_and_filter(criteria) #type: ignore
        if where_filter not in where_candidates:
          where_candidates.append(where_filter)

    for where_filter in where_candidates:
      try:
        result = vector_store.query(
          query_embeddings=embed_query,
          n_result=5,
            where=where_filter,
        )
      except Exception as error:
        raise RetrievalFailed() from error

      documents = result.get("documents") or []
      if any(group for group in documents):
        return documents

    return []