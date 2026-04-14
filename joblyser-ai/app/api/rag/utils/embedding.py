from typing import Any

from chromadb import Documents
from fastembed import TextEmbedding
from langchain_core.documents import Document
from chromadb.api.types import EmbeddingFunction, Embeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


class Embedding(EmbeddingFunction):
  def __init__(self):
    self._model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

  def __call__(self, input: Documents) -> Embeddings:
        embeddings = list(self._model.embed(input))
        return [e.tolist() for e in embeddings]

  def chunks_doc(self, document: list[Document]):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=300)
    chunks = text_splitter.split_documents(documents=document)
    return chunks

  def generate_embeddings(self, texts: list[Any]) -> Embeddings:
    embeddings = list(self._model.embed(texts))
    return [e.tolist() for e in embeddings]

embed = Embedding()