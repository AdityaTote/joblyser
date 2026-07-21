from celery import Celery
from celery.signals import worker_process_init, worker_process_shutdown, worker_shutdown
from kombu import Queue

from langfuse import get_client

from app.core.config import config
from app.db import mongodb, postgres

_db_clients: tuple[postgres.DB, mongodb.DB] | None = None

worker = Celery("ai-agent-worker", broker=config.rabbitmq_uri)

worker.conf.update(
  task_serializer='json',
  accept_content=['json'],
  task_default_queue='ai-agent-worker',
  task_queues=(
    Queue('ai-agent-worker', durable=True),
  ),
  task_routes={
    'worker.tasks.agent': {'queue': 'ai-agent-worker'},
  },
  imports=('app.worker.task',),
  task_acks_late=True,
  task_reject_on_worker_lost=True,
  worker_prefetch_multiplier=1,
)


@worker_process_init.connect
def _initialize_db_clients(**kwargs):
  global _db_clients
  _db_clients = (postgres.DB(config), mongodb.DB(config))


@worker_process_shutdown.connect
def _close_db_clients(**kwargs):
  global _db_clients
  if _db_clients is None:
    return

  pg, mongo = _db_clients
  try:
    pg.close()
  finally:
    mongo.close()
    _db_clients = None


def get_db_clients() -> tuple[postgres.DB, mongodb.DB]:
  if _db_clients is None:
    raise RuntimeError("Database clients are not initialized for this Celery worker process")
  return _db_clients


@worker_shutdown.connect
def _shutdown_langfuse(**kwargs):
  try:
    get_client().shutdown()
  except Exception:
    pass
