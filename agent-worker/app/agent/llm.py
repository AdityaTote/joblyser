import time
import json
from enum import Enum
from typing import Any, Optional, Type
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from tenacity import retry, wait_exponential, stop_after_attempt
from langchain_core.messages import ToolMessage

from app.core.config import config

class TaskEnum(Enum):
    EXTRACT = "extraction"
    GEN = "generation"
    FAST = "fast"

    @classmethod
    def values(cls):
        return [e.value for e in cls]

class LLM:
    def __init__(self, model: str, api_key: str):
        self._model_name = model
        self._api_token = api_key

    def _resolve_task_config(self, task: TaskEnum):
        if task.value == "extraction":
            return self._model_name, 0
        elif task.value == "generation":
            return self._model_name, 0.7
        elif task.value == "fast":
            return "gemini-2.5-flash", 0
        return self._model_name, 0

    def _build_base_model(self, model_name: str, temperature: float):
        return ChatGoogleGenerativeAI(
            model=model_name,
            api_key=self._api_token,
            temperature=temperature,
        )

    def _apply_tools(self, model, tools: Optional[list[Any]]):
        if tools:
            return model.bind_tools(tools)
        return model

    def _apply_structure(self, model, schema: Optional[Type]):
        if schema:
            return model.with_structured_output(schema)  # type: ignore
        return model

    def _inject_guardrails(self, messages: list[Any], tools: Optional[list[Any]], schema: Optional[Type]):
        if tools and schema:
            return [
                {
                    "role": "system",
                    "content": (
                        "If required data is missing, you MUST call tools first. "
                        "After that, return structured output strictly matching schema."
                    ),
                },
                *messages,
            ]
        return messages

    @retry(wait=wait_exponential(min=1, max=3), stop=stop_after_attempt(3))
    def _execute(self, model, messages, meta: dict):
        start = time.time()
        response = model.invoke(messages)
        print(f"[LLM] initial response: {response}")

        while hasattr(response, "tool_calls") and response.tool_calls:
            tool_outputs = []
            for tool_call in response.tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["args"]
                tool_call_id = tool_call["id"]
                tool = next(t for t in meta["tools_list"] if t.name == tool_name)
                result = tool.invoke(tool_args)
                if isinstance(result, str):
                    tool_content = result
                else:
                    tool_content = json.dumps(result, ensure_ascii=False)
                tool_outputs.append(ToolMessage(
                    tool_call_id=tool_call_id,
                    name=tool_name,
                    content=tool_content,
                ))
            messages = [*messages, response, *tool_outputs]
            response = model.invoke(messages)

        latency = time.time() - start
        print(
            f"[LLM] model={meta['model']} task={meta['task']} "
            f"latency={latency:.2f}s"
        )
        return response

    def run(
        self,
        messages: list[Any],
        *,
        task: TaskEnum | str = TaskEnum.EXTRACT,
        tools: Optional[list[Any]] = None,
        schema: Optional[Type] = None,
    ):
        if isinstance(task, str):
            try:
                task_enum = TaskEnum(task)
            except ValueError:
                raise ValueError(f"Invalid task: {task}. Must be one of {TaskEnum.values()}")
        else:
            task_enum = task

        model_name, temperature = self._resolve_task_config(task_enum)
        model = self._build_base_model(model_name, temperature)
        model = self._apply_tools(model, tools)
        model = self._apply_structure(model, schema)
        messages = self._inject_guardrails(messages, tools, schema)

        return self._execute(
            model,
            messages,
            meta={
                "model": model_name,
                "task": task,
                "tools": bool(tools),
                "tools_list": tools or [],
                "structured": bool(schema),
            },
        )

llm = LLM(model=config.gemini_model, api_key=config.gemini_api_key)