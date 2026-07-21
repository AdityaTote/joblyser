from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager
from contextvars import ContextVar, Token
from typing import Any

from langfuse import get_client, propagate_attributes
from langfuse.langchain import CallbackHandler

_langfuse_callbacks: ContextVar[list[Any] | None] = ContextVar("agent_worker_langfuse_callbacks", default=None)


def get_langfuse_callbacks() -> list[Any]:
  callbacks = _langfuse_callbacks.get()
  return callbacks or []


def _stringify(value: Any) -> str:
  if value is None:
    return ""
  return str(value)


def serialize_observation_payload(value: Any) -> Any:
  if value is None or isinstance(value, (str, int, float, bool)):
    return value

  if hasattr(value, "model_dump"):
    try:
      return value.model_dump(mode="json")  # type: ignore[no-any-return]
    except TypeError:
      return value.model_dump()  # type: ignore[no-any-return]

  if isinstance(value, dict):
    return {str(key): serialize_observation_payload(item) for key, item in value.items()}

  if isinstance(value, list):
    return [serialize_observation_payload(item) for item in value]

  return str(value)


@contextmanager
def agent_worker_trace(
  *,
  job_id: str,
  user_id: str,
  session_id: str,
  action: Any,
  input_payload: dict[str, Any],
) -> Iterator[Any]:
  langfuse = get_client()
  handler = CallbackHandler()
  token: Token[list[Any] | None] = _langfuse_callbacks.set([handler])
  action_value = _stringify(action)
  trace_name = f"agent-worker.{action_value}" if action_value else "agent-worker.process"
  tags = ["agent-worker"]
  if action_value:
    tags.append(action_value)

  try:
    with propagate_attributes(
      trace_name=trace_name,
      user_id=_stringify(user_id),
      session_id=_stringify(session_id),
      tags=tags,
      metadata={
        "job_id": _stringify(job_id),
        "action": action_value,
        "service": "agent-worker",
      },
    ):
      with langfuse.start_as_current_observation(
        as_type="span",
        name="worker.process_agent",
        input=input_payload,
      ) as span:
        yield span
  finally:
    _langfuse_callbacks.reset(token)