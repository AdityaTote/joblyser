import json
import pika

from app.core.config import config

def publish_result(job_id: str, session_id: str):
    conn = pika.BlockingConnection(pika.URLParameters(config.rabbitmq_uri))
    ch = conn.channel()
    ch.queue_declare(queue="job-results", durable=True)
    ch.basic_publish(
        exchange="",
        routing_key="job-results",
        body=json.dumps({"job_id": job_id, "session_id": session_id, "status": "completed"}),
        properties=pika.BasicProperties(delivery_mode=2)
    )
    conn.close()