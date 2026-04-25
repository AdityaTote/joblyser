import asyncio
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel
from app.core.config import config
from app.agent.tools import user_data_tool

model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.7, api_key=config.gemini_api_key)

class Output(BaseModel):
    note: str

# test chaining
model_tools = model.bind_tools([user_data_tool])
model_struct = model_tools.with_structured_output(Output)

kwargs = model_struct.bound.kwargs if hasattr(model_struct, "bound") else {}
print("Bound kwargs tools count:", len(kwargs.get("tools", [])))
