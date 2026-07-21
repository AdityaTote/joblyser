from chromadb import HttpClient, Embeddings, Metadata, QueryResult
from chromadb.api.types import Where
from chromadb.errors import NotFoundError


def _get_embed_function():
  # Import lazily to avoid circular imports during app startup.
  from app.api.rag.utils.embedding import embed

  return embed

class VectorStore:
    def __init__(self, host: str, port: int, collection_name: str = "resume", ssl: bool = False) -> None:
      self._client = self._connect(host, port, ssl)
      self._collection_name = collection_name
      self._collection = self._get_collection()

    def _connect(self, host: str, port: int, ssl: bool):
      return HttpClient(host=host, port=port, ssl=ssl)

    def _create_collection(self):
      embed = _get_embed_function()
      return self._client.create_collection(
        name=self._collection_name,
        embedding_function=embed,
        metadata={
          "description": "Document collection for RAG-based chat system",
          "project": "shoku-match",
          "type": "chat-with-documents",
          "purpose": "Store and retrieve document embeddings for conversational AI",
        },
      )

    def _get_collection(self):
      embed = _get_embed_function()
      try:
        return self._client.get_collection(
          name=self._collection_name,
          embedding_function=embed,
        )
      except NotFoundError:
        return self._create_collection()


    def add_embedding(self, ids: list[str], chunks: list[str], embeddings: Embeddings, metadata: list[Metadata]):
      self._collection.add(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadata
      )
    
    def query(self, query_embeddings: Embeddings, n_result: int, where: Where | None = None) -> QueryResult:
      result = self._collection.query(
        query_embeddings=query_embeddings,
        n_results=n_result,
        where=where if where else None
      )
      return result

    def ping(self) -> bool:
      try:
        self._client.heartbeat()
        return True
      except Exception:
        return False
