import json
from typing import Any, cast

from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage

from app.core.prompts import USER_CONTEXT_PROMPT
from app.schema.rag import ContentType
from app.schema.state import (
  AgentState,
  UserContextPlan,
  UserDocumentRef,
  UserProfileStructured,
)
from ..llm import TaskEnum, llm
from ..tools import lookup_tools, set_user_document_registry
from .node import extract_profile_from_chunks, parse_json_payload


DEFAULT_RAG_QUERY = "Summarize the candidate's resume profile, core skills, and experience."
MAX_LOOKUP_TOOL_TURNS = 3


def _sanitize_list(items: list[Any], limit: int) -> list[str]:
  return [text for item in items if (text := str(item).strip())][:limit]


def _build_rag_query(state: AgentState) -> str:
  base_query = (state.agent_query or state.user_query or "").strip()
  jd_data = state.jd_requirements if isinstance(state.jd_requirements, dict) else {}

  role_title = jd_data.get("job_title") or jd_data.get("role_title")
  required_skills = jd_data.get("required_skills") or []
  preferred_skills = jd_data.get("preferred_skills") or []
  responsibilities = jd_data.get("responsibilities") or []
  technologies = jd_data.get("technologies") or []

  condensed_required = _sanitize_list(required_skills, 6)
  condensed_preferred = _sanitize_list(preferred_skills, 4)
  condensed_responsibilities = _sanitize_list(responsibilities, 3)
  condensed_technologies = _sanitize_list(technologies, 6)

  parts: list[str] = []
  if base_query:
    parts.append(base_query)
  if role_title:
    parts.append(f"Target role: {role_title}")
  if condensed_required:
    parts.append("Must-match skills: " + ", ".join(condensed_required))
  if condensed_preferred:
    parts.append("Nice-to-have skills: " + ", ".join(condensed_preferred))
  if condensed_technologies:
    parts.append("Technologies: " + ", ".join(condensed_technologies))
  if condensed_responsibilities:
    parts.append("Responsibility evidence: " + ", ".join(condensed_responsibilities))

  if not parts:
    return DEFAULT_RAG_QUERY

  return " | ".join(parts)


def _state_user_documents(state: AgentState) -> list[UserDocumentRef]:
  if not state.user_id or not state.doc_key:
    return []

  key = (state.rag_key or state.doc_key).strip()

  return [{
    "user_id": state.user_id,
    "document_id": state.doc_key,
    "document_type": (state.rag_document_type or "pdf").lower(),
    "key": key,
  }]


def _pick_fallback_document(state: AgentState) -> UserDocumentRef | None:
  records = _state_user_documents(state)
  if not records:
    return None
  return records[0]


def _invoke_lookup_tool(tool_map: dict[str, Any], tool_call: dict[str, Any]) -> Any:
  tool_name = tool_call.get("name")
  if not isinstance(tool_name, str):
    return {
      "error": "unknown_tool",
      "tool": tool_name,
    }

  tool = tool_map.get(tool_name)
  if tool is None:
    return {
      "error": "unknown_tool",
      "tool": tool_name,
    }

  return tool.invoke(tool_call.get("args", {}))


def build_user_context_plan(state: AgentState) -> UserContextPlan:
    fallback_query = _build_rag_query(state)
    user_id = state.user_id
    available_documents = _state_user_documents(state)

    if not user_id:
        return {
            "needs_user_context": False,
            "reason": "missing_user_id",
            "agent_query": fallback_query,
            "selected_document": None,
        }

    set_user_document_registry(cast(list[dict[str, Any]], available_documents))

    messages = [
        SystemMessage(content=USER_CONTEXT_PROMPT),
        HumanMessage(content=json.dumps({
            "user_query": state.user_query,
            "user_id": user_id,
            "jd_requirements": state.jd_requirements,
            "available_state_documents": available_documents,
            "fallback_query": fallback_query,
        }, ensure_ascii=False)),
    ]

    last_result = None
    tool_map = {tool.name: tool for tool in lookup_tools}

    for _ in range(MAX_LOOKUP_TOOL_TURNS):
        result = llm.run(messages, task=TaskEnum.FAST, tools=lookup_tools)
        messages.append(result)
        last_result = result
        tool_calls = getattr(result, "tool_calls", None) or []

        if not tool_calls:
            break

        for tool_call in tool_calls:
            tool_name = tool_call.get("name")
            tool_output = _invoke_lookup_tool(tool_map, tool_call)
            messages.append(ToolMessage(
                tool_call_id=tool_call["id"],
                name=tool_name or "unknown_tool",
                content=json.dumps(tool_output, ensure_ascii=False),
            ))

    parsed = parse_json_payload(last_result.content if last_result else None) or {}
    selected_document_raw = parsed.get("selected_document")
    selected_document = selected_document_raw if isinstance(selected_document_raw, dict) else _pick_fallback_document(state)
    typed_selected_document = cast(UserDocumentRef | None, selected_document)

    return {
        "needs_user_context": bool(parsed.get("needs_user_context", typed_selected_document is not None)),
        "reason": parsed.get("reason") or ("user_documents_available" if typed_selected_document else "no_document_found"),
        "agent_query": parsed.get("agent_query") or fallback_query,
        "selected_document": typed_selected_document,
    }


def resolve_document_type(raw_document_type: str) -> ContentType:
  try:
    return ContentType(raw_document_type)
  except ValueError:
    return ContentType.PDF


def _normalize_chunk_item(item: Any) -> str | None:
  if isinstance(item, str):
    text = item.strip()
    return text or None

  if isinstance(item, dict):
    for field in ("page_content", "text", "content", "chunk"):
      value = item.get(field)
      if isinstance(value, str):
        text = value.strip()
        if text:
          return text
    return None

  text = str(item).strip()
  return text or None


def flatten_retrieved_chunks(retrieved: Any) -> list[str]:
  payload = retrieved

  # Accept both raw RAG data and API envelope shapes.
  if isinstance(payload, dict):
    if "data" in payload:
      payload = payload.get("data")
    elif "documents" in payload:
      payload = payload.get("documents")

  if payload is None:
    return []

  if not isinstance(payload, list):
    normalized = _normalize_chunk_item(payload)
    return [normalized] if normalized else []

  flattened: list[str] = []
  for group in payload:
    if isinstance(group, list):
      for item in group:
        normalized = _normalize_chunk_item(item)
        if normalized:
          flattened.append(normalized)
      continue

    normalized = _normalize_chunk_item(group)
    if normalized:
      flattened.append(normalized)

  return flattened


def empty_user_profile_structured() -> UserProfileStructured:
  return {
    "summary": None,
    "skills": [],
    "experience": [],
    "education": [],
    "links": {},
  }


def build_user_profile_structured(flattened_docs: list[Any]) -> UserProfileStructured:
  profile = extract_profile_from_chunks(flattened_docs)

  return {
    "summary": profile.get("summary"),
    "skills": profile.get("technical_skills", []),
    "experience": profile.get("experience", []),
    "education": profile.get("education", []),
    "links": profile.get("links", {}),
  }
