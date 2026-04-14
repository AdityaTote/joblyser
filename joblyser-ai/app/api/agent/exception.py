class AgentError(Exception):
  def __init__(self, message: str, code: str = "agent_error", status_code: int = 500):
    super().__init__(message)
    self.message = message
    self.code = code
    self.status_code = status_code


class InvalidAgentRequest(AgentError):
  def __init__(self, message: str = "Invalid agent request"):
    super().__init__(message=message, code="invalid_agent_request", status_code=400)


class SessionCreateFailed(AgentError):
  def __init__(self, message: str = "Failed to create session"):
    super().__init__(message=message, code="session_create_failed", status_code=500)


class JobCreateFailed(AgentError):
  def __init__(self, message: str = "Failed to create agent job"):
    super().__init__(message=message, code="job_create_failed", status_code=500)


class QueuePublishFailed(AgentError):
  def __init__(self, message: str = "Failed to publish agent job"):
    super().__init__(message=message, code="queue_publish_failed", status_code=503)


class JobStatusUpdateFailed(AgentError):
  def __init__(self, message: str = "Failed to update job status"):
    super().__init__(message=message, code="job_status_update_failed", status_code=500)