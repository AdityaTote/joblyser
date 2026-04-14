# Joblyser

Joblyser is an AI-powered job application platform for resume-assisted analysis and content generation (reviews, cover letters, cold emails, and LinkedIn notes).

This repository is a monorepo containing all runtime services and shared migration assets.

## Monorepo Layout

| Path           | Service          | Purpose                                                      |
| -------------- | ---------------- | ------------------------------------------------------------ |
| `joblyser-web` | Next.js          | User-facing web application                                  |
| `joblyser-api` | Go               | API gateway, auth, orchestration, document/profile endpoints |
| `joblyser-ai`  | FastAPI (Python) | AI session/chat service and job lifecycle APIs               |
| `agent-worker` | Celery (Python)  | Asynchronous agent execution worker                          |
| `migrations`   | SQL              | Postgres schema migrations                                   |
| `docs`         | Markdown         | Architecture and development documentation                   |

## System Overview

1. The web app sends user actions (review/generation requests) to `joblyser-api`.
2. `joblyser-api` authenticates requests and forwards agent operations to `joblyser-ai`.
3. `joblyser-ai` creates jobs/sessions and enqueues background execution.
4. `agent-worker` processes jobs, writes outputs to chat storage, and updates job status.
5. The web app polls job status and fetches session chat history for rendering/editing.

## Platform Capabilities

- **JD analysis**: Skill matching, strengths/gaps, and fit summary.
- **Generated assets**: Cover letter, cold email, and LinkedIn note generation.
- **Session history**: Multi-run chat history per server-generated session.
- **Resume workflow**:
  - upload resume documents
  - select profile primary resume
  - use profile or ad-hoc resume in session
- **Editable outputs**:
  - `cover_letter`, `linkedin_note`, `cold_mail` support editing
  - edits are persisted via orchestrated API routes with debounced autosave.

## Prerequisites

- Node.js (LTS) and npm
- Go 1.25+
- Python 3.13+
- PostgreSQL
- MongoDB
- RabbitMQ

## Docker Compose Setup

1. Copy `.env.example` to `.env` at the repository root.
2. Replace all placeholder passwords with strong random values.
3. Start the stack: `docker compose up --build`.

By default, host port bindings in `docker-compose.yml` are restricted to `127.0.0.1` for safer local usage. Only set `POSTGRES_BIND_HOST`, `API_BIND_HOST`, or `WEB_BIND_HOST` to `0.0.0.0` when you intentionally want external access.

## Local Runbook

1. Start infrastructure dependencies:
   - PostgreSQL
   - MongoDB
   - RabbitMQ
2. Apply SQL migrations from `migrations/`.
3. Start services in this order:
   - `joblyser-ai`
   - `agent-worker`
   - `joblyser-api`
   - `joblyser-web`

For service-specific commands and environment variables, see each service README.

## Current Product Behaviors

- Session IDs are server-generated.
- Profile supports primary resume selection.
- Session supports uploading a new resume or using profile resume.
- Editable outputs (`cover_letter`, `linkedin_note`, `cold_mail`) are auto-saved with debounce.

## Repository Conventions

- Treat services as independent deployable units.
- Keep API contracts explicit and versioned under `/api/v1`.
- Prefer server-owned identifiers for persistent entities (sessions/chats/jobs).
- Avoid committing secrets; use local env files and templates.

## Documentation

- Workspace docs index: `docs/README.md`
- Developer workflow guide: `docs/development-workflow.md`
