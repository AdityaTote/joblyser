from pydantic import BaseModel

class TaskParams(BaseModel):
  job_id: str
  user_id: str
  session_id: str

class ProducerMessage(BaseModel):
  id: str
  task: str
  kwargs: TaskParams
  args: list = []
  retries: int = 0

class MessageQueueTasks:
  AGENT = "worker.tasks.agent"

class MessageQueues:
  AGENT = "ai-agent-worker"