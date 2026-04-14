class RagError(Exception):
  def __init__(self, message: str, code: str = "rag_error", status_code: int = 500):
    super().__init__(message)
    self.message = message
    self.code = code
    self.status_code = status_code


class InvalidRagRequest(RagError):
  def __init__(self, message: str = "Invalid RAG request"):
    super().__init__(message=message, code="invalid_rag_request", status_code=400)


class DocumentLoadFailed(RagError):
  def __init__(self, message: str = "Failed to load document"):
    super().__init__(message=message, code="document_load_failed", status_code=422)


class EmbeddingGenerationFailed(RagError):
  def __init__(self, message: str = "Failed to generate embeddings"):
    super().__init__(message=message, code="embedding_generation_failed", status_code=500)


class VectorStoreUnavailable(RagError):
  def __init__(self, message: str = "Vector store unavailable"):
    super().__init__(message=message, code="vector_store_unavailable", status_code=503)


class VectorStoreWriteFailed(RagError):
  def __init__(self, message: str = "Failed to store embeddings"):
    super().__init__(message=message, code="vector_store_write_failed", status_code=500)


class RetrievalFailed(RagError):
  def __init__(self, message: str = "Failed to retrieve relevant context"):
    super().__init__(message=message, code="retrieval_failed", status_code=500)