# Development Workflow

## 1) Before Coding

- Pull latest changes.
- Ensure local `.env` values are present for each service.
- Run/verify DB migrations.

## 2) During Coding

- Keep changes scoped by service.
- Validate behavior with real end-to-end flows where possible.
- Prefer server-generated identifiers for persisted entities.

## 3) Validation Checklist

- Frontend changed:
  - run lints
  - verify route-level UX
- Go API changed:
  - run `go test ./...` (or scoped package tests)
  - run `gofmt` on edited files
- Python AI/worker changed:
  - run syntax/type checks used in your environment

## 4) Integration Paths to Verify

- Resume upload -> primary resume set -> session run
- Run agent -> poll job status -> session output render
- Editable outputs -> debounce save -> refresh persistence
