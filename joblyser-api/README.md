# joblyser-api

Go API gateway/orchestration layer for Joblyser.

## Responsibilities

- Auth + user profile endpoints
- Document upload and profile resume linking
- Agent orchestration routes (run/status/session/chat edit proxy)
- Token signing for downstream AI service calls
- Request validation, error normalization, and access control boundaries

## Tech Stack

- Go 1.25+
- Chi router
- PostgreSQL (pgx)
- Zerolog

## Environment

Create `.env` in this folder (or use your existing config file):

```bash
PORT=8081
DB_URL=postgres://...
AI_SERVICE_URI=http://localhost:8080/api/v1
JWT_SECRET_AI_SERVICE=...
```

Also configure any AWS/S3 keys used by document routes.

Commonly required values in most setups:

- `PORT`
- `DB_URL`
- `AI_SERVICE_URI`
- `JWT_SECRET_AI_SERVICE`
- cloud storage credentials for `/documents/*`

## Run

```bash
go mod tidy
go run ./cmd/joblyser-api
```

## Test

```bash
go test ./...
```

## Important Routes (prefix `/api/v1`)

- `/auth/*`
- `/users/*`
- `/documents/*`
- `/agent/run`
- `/agent/jobs/{jobId}`
- `/agent/sessions/{sessionId}`
- `/agent/chats/{chatId}/edit`

## Integration Notes

- This service is the trusted backend for `joblyser-web`.
- Agent run/status/session/edit routes proxy or orchestrate behavior with `joblyser-ai`.
- User profile now supports a primary resume key; profile flows should use backend-owned validation.
