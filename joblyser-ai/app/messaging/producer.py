from celery import Celery

from .schema import MessageQueueTasks, MessageQueues, ProducerMessage
from app.config.main import config

class CeleryProducer:
  def __init__(self, rabbitmq_uri: str):
    self.app = None
    if Celery is not None:
      self.app = Celery("joblyser-ai-producer", broker=rabbitmq_uri)
      self.app.conf.update(
        task_serializer="json",
        accept_content=["json"],
      )

  def publish(self, message: ProducerMessage):
    if self.app is None:
      raise RuntimeError("Celery is not installed. Install dependency 'celery' to publish tasks.")

    self.app.send_task(
      message.task,
      args=message.args,
      kwargs=message.kwargs.model_dump(),
      task_id=message.id,
      queue=self.queues.AGENT,
      headers={"user_id": message.kwargs.user_id},
    )
  
  @property
  def tasks(self):
    return MessageQueueTasks()

  @property
  def queues(self):
    return MessageQueues()

  def close(self):
    if self.app is not None:
      self.app.close()

producer = CeleryProducer(rabbitmq_uri=config.rabbitmq_uri)