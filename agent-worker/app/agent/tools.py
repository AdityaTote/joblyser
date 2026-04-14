import asyncio
from typing import Any, List, Optional

from langchain_core.tools import tool
from langchain_tavily import TavilySearch

from app.schema.rag import RagQuery, ContentType
from app.services.rag import RagService
from app.core.config import config


_USER_DOCUMENT_REGISTRY: dict[str, list[dict[str, Any]]] = {}


def _normalize_document_type_value(document_type: Optional[str]) -> str:
  normalized_document_type = (document_type or ContentType.PDF.value).lower()
  if normalized_document_type not in {item.value for item in ContentType}:
    normalized_document_type = ContentType.PDF.value
  return normalized_document_type


def _resolve_document_key(
  user_id: str,
  normalized_document_type: str,
  key: Optional[str],
  document_id: Optional[str],
) -> Optional[str]:
  direct_key = (key or document_id or "").strip()
  if direct_key:
    return direct_key

  user_records = _USER_DOCUMENT_REGISTRY.get(str(user_id), [])
  if not user_records:
    return None

  matching_type = [
    record for record in user_records
    if str(record.get("document_type", "")).lower() == normalized_document_type
  ]

  for record in [*matching_type, *user_records]:
    candidate_key = str(record.get("key") or record.get("document_id") or "").strip()
    if candidate_key:
      return candidate_key

  return None


def _normalize_document_record(record: dict[str, Any]) -> dict[str, Any]:
  normalized = dict(record)
  document_type = normalized.get("document_type", ContentType.PDF.value)
  if isinstance(document_type, ContentType):
    normalized["document_type"] = document_type.value
  else:
    normalized["document_type"] = str(document_type).lower()
  return normalized


def set_user_document_registry(records: Optional[List[dict[str, Any]]] = None) -> None:
  _USER_DOCUMENT_REGISTRY.clear()
  for record in records or []:
    normalized = _normalize_document_record(record)
    user_id = normalized.get("user_id")
    if not user_id:
      continue
    _USER_DOCUMENT_REGISTRY.setdefault(str(user_id), []).append(normalized)


@tool
def lookup_user_documents(user_id: str) -> List[dict[str, Any]]:
  """
  Lookup available user documents from the application registry.
  This tool represents the DB lookup step used before building a RAG query.
  """

  return _USER_DOCUMENT_REGISTRY.get(user_id, [])


@tool
def user_data_tool(
  query: str,
  user_id: str,
  document_type: str,
  key: Optional[str] = None,
  document_id: Optional[str] = None,
) -> Optional[List[List[str]]]:
  """
  Retrieves relevant information from a user's resume using RAG from vector store.
  
  Args:
    query (str): Search query for resume information.
    user_id (str): User identifier.
    document_type (ContentType): Type of document content.
    key (str): Storage key for the source document.
  
  Returns:
    list[list[str]] | None: Retrieved document chunks grouped by query.
  
  Raises:
    ValueError: If inputs are invalid.
    ConnectionError: If vector store connection fails.
  """
  print("hello from tool")
  normalized_document_type = _normalize_document_type_value(document_type)
  resolved_key = _resolve_document_key(
    user_id=user_id,
    normalized_document_type=normalized_document_type,
    key=key,
    document_id=document_id,
  )

  if not resolved_key:
    return None

  result = asyncio.run(RagService.retrieve(RagQuery(
    user_id=user_id,
    user_query=query,
    document_type=ContentType(normalized_document_type),
    key=resolved_key,
  )))
  print("hello from tool after query")
  return result

lookup_tools = [lookup_user_documents]

search_tool= TavilySearch(
      max_results=1,
      topic="general",
      include_answer=False,
      include_raw_content=True,
      include_images=False,
      include_image_descriptions=False,
      search_depth="advanced",
      tavily_api_key=config.tavily_search_key,
    )

tools = [lookup_user_documents, user_data_tool, search_tool]