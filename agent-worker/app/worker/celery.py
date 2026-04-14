from celery import Celery
from kombu import Queue

from app.core.config import config

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