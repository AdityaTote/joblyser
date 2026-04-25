import asyncio
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from app.core.config import config
from app.agent.tools import user_data_tool

model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.7, api_key=config.gemini_api_key)
model_with_tools = model.bind_tools([user_data_tool])

with open("data/prompts/linkedin_note_prompt.txt") as f:
    sys_prompt = f.read()

sys_msg = SystemMessage(content=sys_prompt)
user_msg = HumanMessage(content=json.dumps({
    "jd_requirements": "Looking for Go and Node.js developer.",
    "user_profile": {"name": "John Doe", "skills": []},
    "user_id": "123",
    "document_id": "pdf-123",
    "document_type": "pdf",
    "key": "test"
}))
res1 = model_with_tools.invoke([sys_msg, user_msg])
print("Res1 tool calls count:", len(res1.tool_calls) if hasattr(res1, "tool_calls") else 0)
if res1.tool_calls:
    tool_outputs = []
    for tc in res1.tool_calls:
        val = user_data_tool.invoke(tc["args"])
        tool_outputs.append(ToolMessage(tool_call_id=tc["id"], name=tc["name"], content=str(val)))
    messages = [sys_msg, user_msg, res1, *tool_outputs]
    res2 = model_with_tools.invoke(messages)
    print("Res2 content:", repr(res2.content))
else:
    print("Res1 content:", repr(res1.content))
