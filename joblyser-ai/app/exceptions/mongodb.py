class MongoConfigError(Exception):
  def __init__(self, message: str):
    super().__init__(message)


class MongoConnectionFailed(Exception):
  def __init__(self, message: str):
    super().__init__(message)


class SessionNotFound(Exception):
  def __init__(self, session_id: str):
    super().__init__(f"Session {session_id} not found",)
    self.session_id = session_id


class SessionFetchFailed(Exception):
  def __init__(self):
    super().__init__("Failed to fetch session")


class SessionChatsFetchFailed(Exception):
  def __init__(self):
    super().__init__("Failed to fetch session chats")


class AgentResultStoreFailed(Exception):
  def __init__(self):
    super().__init__("Failed to store agent result")
