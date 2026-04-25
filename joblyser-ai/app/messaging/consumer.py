# app/consumer.py
import aio_pika
import asyncio
import json
from aio_pika.abc import AbstractIncomingMessage
from .schema import JOB_QUEUE
from app.config.main import config

async def start_result_consumer():
    connection = await aio_pika.connect_robust(config.rabbitmq_uri)
    channel = await connection.channel()
    
    queue = await channel.declare_queue("job-results", durable=True)
    
    async def on_message(message: AbstractIncomingMessage):
        async with message.process():
            data = json.loads(message.body)
            job_id = data["job_id"]
            
            if job_id in JOB_QUEUE:
                await JOB_QUEUE[job_id].put(data)
    
    await queue.consume(on_message)
    await asyncio.Future()