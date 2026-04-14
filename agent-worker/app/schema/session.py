from pydantic import BaseModel, ConfigDict, Field


class SessionRow(BaseModel):
  id: str = Field(alias="_id")
  user_id: str

  model_config = ConfigDict(populate_by_name=True)


class AgentResultRow(BaseModel):
  id: str = Field(alias="_id")
  user_id: str

  model_config = ConfigDict(populate_by_name=True)