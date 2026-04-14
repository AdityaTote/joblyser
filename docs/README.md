# Joblyser Docs

Workspace-level documentation for architecture, development workflow, and operational notes.

## Current Documents

- `docs/development-workflow.md` - day-to-day coding, validation, and integration checklist.

## Documentation Goals

- Keep architecture and API contracts discoverable.
- Document service boundaries and ownership.
- Provide reproducible local and production runbooks.

## Suggested Documents to Add

- `docs/api-contracts.md` - API surface between `joblyser-web`, `joblyser-api`, and `joblyser-ai`
- `docs/session-lifecycle.md` - run flow, polling behavior, and chat persistence
- `docs/deploy-runbook.md` - environment setup and deploy/rollback procedure
- `docs/troubleshooting.md` - common runtime and integration issues

## Scope

Service-specific setup and run instructions live in each service README:

- `joblyser-web/README.md`
- `joblyser-api/README.md`
- `joblyser-ai/README.md`
- `agent-worker/README.md`

## Style Guidelines

- Prefer concise sections with explicit commands.
- Use consistent naming (`session_id`, `job_id`, `chat_id`) across docs.
- Mention assumptions and defaults (ports, prefixes, env keys).
