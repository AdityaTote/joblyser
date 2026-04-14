# joblyser-web

Frontend application for Joblyser, built with Next.js App Router + React Query + Zustand.

## Responsibilities

- User auth screens (`signin`, `signup`, callback flow)
- Session workspace UI (`/sessions/[sessionId]`)
- Profile and resume management UI
- Job polling and AI output rendering/editing
- Session history browsing and previous-run selection

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand

## Environment

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1
```

## Default Runtime

- App URL: `http://localhost:3000`
- API base (expected): `http://localhost:8081/api/v1`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - run ESLint

## Key Folders

- `src/app` - routes/layouts
- `src/components` - UI components
- `src/hooks/queries` - API query/mutation hooks
- `src/lib/api` - API client/services
- `src/store` - persisted client store

## Session UX Notes

- `/sessions/new` starts a draft screen; first run gets a server-generated `session_id`.
- Job status is polled every 5 seconds until completion/failure.
- Editable result types autosave with debounce via edit route orchestration.

## Quality Checks

```bash
npm run lint
```
