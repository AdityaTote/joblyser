# agent-worker

Background worker service for asynchronous AI task execution.

## Responsibilities

- Consume queued `ai-agent-worker` jobs
- Execute agent graph/orchestration logic
- Store generated agent output in MongoDB chats
- Update job status and `chat_id` in Postgres
- Maintain deterministic lifecycle transitions for polling clients

## Tech Stack

- Python 3.13+
- Celery
- MongoDB (PyMongo)
- Postgres (psycopg2)

## Run

Install dependencies:

```bash
pip install -e .
```

Start worker:

```bash
python main.py
```

Default worker args (from `main.py`):
- queue: `ai-agent-worker`
- pool: `solo`
- concurrency: `1`

## Notes

- Worker expects infrastructure to be available:
  - RabbitMQ
  - MongoDB
  - Postgres
- Service behavior is tightly coupled with `joblyser-ai` job/session contracts.

## Queue Contract

- Queue name: `ai-agent-worker`
- Jobs should include enough context to resolve user/session safely.
- On completion/failure, worker must update status fields consumed by polling APIs.
