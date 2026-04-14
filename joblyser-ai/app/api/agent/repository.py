from psycopg import AsyncCursor

from .schema import CreateJobParams, JobResponse, JobStatusResponse, JobStatus


class JobRepository:
  @staticmethod
  async def create(data: CreateJobParams, db: AsyncCursor) -> JobStatusResponse:
    query = """
      INSERT INTO jobs (user_id, session_id, action, doc_key, user_query, jd_text, status)
      VALUES (%s, %s, %s, %s, %s, %s, %s)
      RETURNING id, session_id, status
    """
    await db.execute(
      query,
      (
        data.user_id,
        data.session_id,
        data.action,
        data.doc_key,
        data.user_query,
        data.jd_text,
        data.status,
      ),
    )
    job = await db.fetchone()
    if job is None:
      raise ValueError("Failed to create job record")
    return JobStatusResponse(id=str(job[0]), session_id=str(job[1]), status=str(job[2]))

  @staticmethod
  async def update_status(job_id: str, status: JobStatus, db: AsyncCursor) -> JobStatusResponse:
    query = """
      UPDATE jobs
      SET status = %s
      WHERE id = %s
      RETURNING id, session_id, status
    """
    await db.execute(query, (status, job_id))
    job = await db.fetchone()
    if job is None:
      raise ValueError("Failed to update job status")
    return JobStatusResponse(id=str(job[0]), session_id=str(job[1]), status=str(job[2]))

  @staticmethod
  async def get_job_id(job_id: str, user_id: str, db: AsyncCursor) -> JobStatusResponse:
    query = """
      SELECT id, session_id, status, chat_id
      FROM jobs
      WHERE id = %s AND user_id = %s
    """
    await db.execute(query, (job_id, user_id))
    job = await db.fetchone()
    if job is None:
      raise ValueError("Job not found")
    return JobStatusResponse(id=str(job[0]), session_id=str(job[1]), status=str(job[2]), chat_id=str(job[3]) if job[3] is not None else None)

  @staticmethod
  async def get_job(job_id: str, db: AsyncCursor) -> JobResponse:
    query = """
      SELECT id, status, session_id, chat_id, user_id
      FROM jobs
      WHERE id = %s
    """
    await db.execute(query, (job_id,))
    job = await db.fetchone()
    if not job:
      raise ValueError("job not found")
    return JobResponse(
      id=str(job[0]),
      status=str(job[1]),
      session_id=str(job[2]),
      chat_id=str(job[3]) if job[3] is not None else None,
      user_id=str(job[4]),
    )
