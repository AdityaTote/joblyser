from functools import lru_cache

from app.core.config import config
from app.db import mongodb, postgres
from app.exceptions.postgres import WorkerFlowError
from app.schema import jobs, state
from app.agent import run_workflow
from .celery import worker

@lru_cache(maxsize=1)
def _get_db_clients() -> tuple[postgres.DB, mongodb.DB]:
  return postgres.DB(config), mongodb.DB(config)

# @args: {
#   job_id: str
#   user_id: str
#   session_id: str
# }
@worker.task(bind=True, max_retries=3, name="worker.tasks.agent")
def process_agent(self, job_id: str, user_id: str, session_id: str):
  pg = None
  try:
    pg, mongo = _get_db_clients()

    # check wether the job is present
    job = pg.find_job(job_id=job_id, user_id=user_id, session_id=session_id)

    # check session
    session = mongo.get_session_by_id(session_id=session_id)

    # update the job status to processing
    pg.update_job(job_id=job.id, job_status=jobs.JobStatus.processing)

    # get the previous session chats for context
    chats = mongo.get_session_chats(session_id=session.id)

    # run the agent
    result = run_workflow(
      input_state=state.AgentState(
        action=job.action,
        doc_key=job.doc_key,
        user_id=job.user_id,
        user_query=job.user_query,
        jd_text=job.jd_text,
          context=[chat for chat in chats],
      )
    )

    if result is None:
      pg.update_job(job_id=job.id, job_status=jobs.JobStatus.failed)
      return

    # store the agent result in mongodb
    chat = mongo.store_agent_result(
      session_id=session.id, 
      user_id=job.user_id, 
      agent_output=result,
      jd_text=job.jd_text,
      doc_key=job.doc_key,
      user_query=job.user_query
    )

    # update the job status to completed
    pg.update_job_after_agent_result(job_id=job.id, chat_id=chat.id ,job_status=jobs.JobStatus.completed)

  except WorkerFlowError as exc:
    if exc.retryable:
      raise self.retry(exc=exc, countdown=5 * (self.request.retries + 1))
    if pg is not None:
      try:
        pg.update_job(job_id=job_id, job_status=jobs.JobStatus.failed)
      except Exception:
        pass
    raise
  except Exception as exc:
    if pg is not None:
      try:
        pg.update_job(job_id=job_id, job_status=jobs.JobStatus.failed)
      except Exception:
        pass
    raise self.retry(exc=exc, countdown=5 * (self.request.retries + 1))
