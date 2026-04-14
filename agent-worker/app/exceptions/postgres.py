class WorkerFlowError(Exception):
  def __init__(self, message: str, retryable: bool = True, error: Exception | None = None):
    self.message = message
    self.retryable = retryable
    self.error = error
    super().__init__(self.message)


class JobNotFound(WorkerFlowError):
  def __init__(self, id: str, error: Exception | None = None):
    super().__init__(
      message=f"job with {id} not found",
      retryable=False,
      error=error,
    )
    self.id = id