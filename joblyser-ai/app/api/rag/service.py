from app.database.chroma import VectorStore
from app.api.rag.utils.doc_loader import DocumentLoader

from .schema import RagQuery, RagStore
from .utils import Rag
from .exception import InvalidRagRequest, RagError, RetrievalFailed

class RagService:
  @staticmethod
  async def store(input_data: RagStore, vector_store: VectorStore, document_loader: DocumentLoader):
    if not input_data.key.strip():
      raise InvalidRagRequest("Document key is required")

    try:
      await Rag.store(input=input_data, vector_store=vector_store, document_loader=document_loader)
    except RagError:
      raise
    except Exception as error:
      raise RetrievalFailed("Unexpected error while storing document") from error
    return True

  @staticmethod
  async def query(input_data: RagQuery, vector_store: VectorStore):
    if not input_data.key.strip():
      raise InvalidRagRequest("Document key is required")
    if not input_data.user_query.strip():
      raise InvalidRagRequest("Query text is required")

    try:
      data = await Rag.query(input=input_data, vector_store=vector_store)
    except RagError:
      raise
    except Exception as error:
      raise RetrievalFailed("Unexpected error while querying document") from error
    return data
