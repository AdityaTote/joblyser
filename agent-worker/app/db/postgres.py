from contextlib import contextmanager
from psycopg2.pool import SimpleConnectionPool
from psycopg2.extras import RealDictCursor
from psycopg2.errors import UndefinedColumn

from app.core.config import Config
from app.schema.jobs import JobRow, JobStatus
from app.exceptions.postgres import JobNotFound

class DB:
  def __init__(self, config: Config):
    self._pool = self._init_pool(config)

  def _init_pool(self, config: Config):
    return SimpleConnectionPool(
      minconn=1,
      maxconn=10,
      dbname=config.postgres_name,
      user=config.postgres_user,
      password=config.postgres_password,
      host=config.postgres_host,
      port=config.postgres_port,
    )

  @contextmanager
  def _get_conn(self):
    conn = self._pool.getconn()
    try:
      yield conn
      conn.commit()
    except Exception:
      conn.rollback()
      raise
    finally:
      self._pool.putconn(conn)

  def find_job(self, job_id: str, user_id: str, session_id: str) -> JobRow:
    query = """
      SELECT *
      FROM jobs
      WHERE id = %s AND user_id = %s AND session_id = %s
    """
    with self._get_conn() as conn:
      with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, (job_id, user_id, session_id))
        result = cur.fetchone()
    if not result:
      raise JobNotFound(id=job_id)
    return JobRow.model_validate(result)

  def update_job(self, job_id: str, job_status: JobStatus):
    query = """
      UPDATE jobs
      SET status = %s
      WHERE id = %s
      RETURNING id, status
    """
    with self._get_conn() as conn:
      with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(query, (job_status, job_id))
        result = cur.fetchone()
    if not result:
      raise JobNotFound(id=job_id)
    return result
  
  def update_job_after_agent_result(self, job_id: str, chat_id: str, job_status: JobStatus):
    query = """
      UPDATE jobs
      SET status = %s, chat_id = %s
      WHERE id = %s
      RETURNING id, status
    """
    fallback_query = """
      UPDATE jobs
      SET status = %s
      WHERE id = %s
      RETURNING id, status
    """
    with self._get_conn() as conn:
      with conn.cursor(cursor_factory=RealDictCursor) as cur:
        try:
          cur.execute(query, (job_status, chat_id, job_id))
        except UndefinedColumn:
          cur.execute(fallback_query, (job_status, job_id))
        result = cur.fetchone()
    if not result:
      raise JobNotFound(id=job_id)
    return result

  def close(self):
    self._pool.closeall()