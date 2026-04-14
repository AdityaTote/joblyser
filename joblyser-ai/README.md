# joblyser-ai

Python FastAPI service for AI session/chat and job coordination.

## Responsibilities

- Create/manage AI sessions in MongoDB
- Create and track job records
- Expose session and chat retrieval endpoints
- Handle chat edit persistence for editable output types
- Interface with RAG and related AI pipeline components
- Expose stable job/session APIs consumed by `joblyser-api`

## Tech Stack

- Python 3.13+
- FastAPI
- Motor (MongoDB)
- Psycopg (Postgres access where needed)

## Run

Install dependencies (using your preferred toolchain):

```bash
pip install -e .
```

Start server:

```bash
python main.py
```

Default host/port from `main.py`:
- host: `127.0.0.1`
- port: `8080`

## Core Endpoints (prefix `/api/v1`)

- `POST /agent/run`
- `GET /agent/status/{job_id}`
- `GET /agent/sessions`
- `GET /agent/sessions/{session_id}`
- `PATCH /agent/chats/{chat_id}/edit`
- `POST /rag/*`

## Data Ownership

- MongoDB stores sessions/chats and generated payloads.
- Postgres stores job state and metadata needed for orchestration.
- Worker updates job lifecycle; API routes read and expose normalized status.

## Operational Notes

- Ensure MongoDB, Postgres, and queue dependencies are reachable before startup.
- Keep response shapes stable for downstream clients (`joblyser-api`, then `joblyser-web`).
