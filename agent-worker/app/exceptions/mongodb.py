from app.exceptions.postgres import WorkerFlowError


class MongoConfigError(WorkerFlowError):
  def __init__(self, message: str, error: Exception | None = None):
    super().__init__(message=message, retryable=False, error=error)


class MongoConnectionFailed(WorkerFlowError):
  def __init__(self, error: Exception | None = None):
    super().__init__(
      message="Failed to connect to MongoDB",
      retryable=True,
      error=error,
    )


class SessionNotFound(WorkerFlowError):
  def __init__(self, session_id: str, error: Exception | None = None):
    super().__init__(
      message=f"Session {session_id} not found",
      retryable=False,
      error=error,
    )
    self.session_id = session_id


class SessionFetchFailed(WorkerFlowError):
  def __init__(self, error: Exception | None = None):
    super().__init__(
      message="Failed to fetch session",
      retryable=True,
      error=error,
    )


class SessionChatsFetchFailed(WorkerFlowError):
  def __init__(self, error: Exception | None = None):
    super().__init__(
      message="Failed to fetch session chats",
      retryable=True,
      error=error,
    )


class AgentResultStoreFailed(WorkerFlowError):
  def __init__(self, error: Exception | None = None):
    super().__init__(
      message="Failed to store agent result",
      retryable=True,
      error=error,
    )
