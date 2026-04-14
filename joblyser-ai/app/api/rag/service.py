from .schema import RagQuery, RagStore
from .utils import Rag
from .exception import InvalidRagRequest, RagError, RetrievalFailed

class RagService:
  @staticmethod
  async def store(input_data: RagStore):
    if not input_data.key.strip():
      raise InvalidRagRequest("Document key is required")

    try:
      await Rag.store(input=input_data)
    except RagError:
      raise
    except Exception as error:
      raise RetrievalFailed("Unexpected error while storing document") from error
    return True

  @staticmethod
  async def query(input_data: RagQuery):
    if not input_data.key.strip():
      raise InvalidRagRequest("Document key is required")
    if not input_data.user_query.strip():
      raise InvalidRagRequest("Query text is required")

    try:
      data = await Rag.query(input=input_data)
    except RagError:
      raise
    except Exception as error:
      raise RetrievalFailed("Unexpected error while querying document") from error
    return data