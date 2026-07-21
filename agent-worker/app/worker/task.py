from app.core.langfuse import agent_worker_trace, serialize_observation_payload
from app.exceptions.postgres import WorkerFlowError
from app.schema import jobs, state
from app.agent import run_workflow
from .celery import get_db_clients, worker
from .consumer import publish_result

# @args: {
#   job_id: str
#   user_id: str
#   session_id: str
# }
@worker.task(bind=True, max_retries=3, name="worker.tasks.agent")
def process_agent(self, job_id: str, user_id: str, session_id: str):
  pg = None
  try:
    pg, mongo = get_db_clients()

    # check wether the job is present
    job = pg.find_job(job_id=job_id, user_id=user_id, session_id=session_id)
    action_value = getattr(job.action, "value", job.action)

    # check session
    session = mongo.get_session_by_id(session_id=session_id)

    # update the job status to processing
    pg.update_job(job_id=job.id, job_status=jobs.JobStatus.processing)

    # get the previous session chats for context
    chats = mongo.get_session_chats(session_id=session.id)

    trace_input = {
      "job_id": job_id,
      "user_id": user_id,
      "session_id": session_id,
      "action": str(action_value),
      "user_query": job.user_query,
      "has_job_description": bool(job.jd_text),
      "has_document": bool(job.doc_key),
    }

    with agent_worker_trace(
      job_id=job_id,
      user_id=user_id,
      session_id=session_id,
      action=action_value,
      input_payload=trace_input,
    ) as trace_span:
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

      trace_span.update(
        output={
          "status": "completed" if result is not None else "failed",
          "generated_output": serialize_observation_payload(result),
        }
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

    publish_result(job_id=job.id, session_id=session.id)

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
    raise self.retry(exc=Exception(str(exc)), countdown=5 * (self.request.retries + 1))
