# Career study notes

Use this while we build. After each phase, you should be able to explain the items out loud in 60–90 seconds.

## How to study (do this every session)

1. Read the file we just changed.
2. Say in your own words: what it does, why it exists, what breaks if we delete it.
3. Write one interview sentence: "I chose X because Y."

Do not memorize framework trivia. Hiring managers want judgment.

## Phase 2 — say these out loud

### Monorepo
One git repo, two apps (`apps/web`, `apps/api`) plus shared types. Teams do this so frontend and backend ship together and share TypeScript types.

Interview line: "I used a pnpm workspace so the Next.js UI and NestJS API stay in one repo, with shared types, instead of two disconnected projects."

### Why not Next.js API routes only?
Next.js can host APIs. We still use NestJS because this project has real business rules: booking conflicts, contact workflows, auth, Google Calendar. NestJS modules, DTOs, and dependency injection look like enterprise backends (similar story to Spring).

Interview line: "The UI is Next.js. Domain logic lives in NestJS so the API is testable and structured like a production service."

### Controller → Service → Prisma
- Controller: HTTP route, validation, status codes
- Service: business rules
- Prisma: SQL / database

If you put booking-conflict logic in the controller, interviews will ding you.

### Health check
`GET /api/health` runs `SELECT 1` against Postgres. Load balancers and you (on the homepage) use this to know the API **and** the database are up, not just that Node started.

### Docker for Postgres
The database runs in a container. Your Mac does not need a local Postgres install. Same idea as production: the app and the database are separate processes.

### Prisma schema ideas that get jobs
- **1:1** User ↔ Teacher (`userId` is unique on Teacher)
- **1:many** Teacher → Students
- **many-to-many** Student ↔ Guardian through `StudentGuardian`
- **Unique constraint** `Appointment(teacherId, startsAt)` — this is how you mention race conditions later
- **Enums** for contact status — a workflow, not a boolean `done`

### Secrets
`.env` is gitignored. `.env.example` is committed with fake values. Never put real student data, Google tokens, or JWT secrets in git.

### Validation and CORS
`ValidationPipe` rejects extra/invalid body fields. CORS only allows the Next.js origin. Both are junior-to-mid security talking points.

## Later phases (do not cram now)

| When we build it | What you will learn |
| --- | --- |
| Login | Auth vs authorization, password hashing, JWT/cookies |
| Contacts | State machines, 1-to-many history, indexes |
| Booking | Transactions, unique constraints, race conditions |
| Google Calendar | OAuth 2.0, refresh tokens, least privilege |
| Tests | Jest unit tests, Playwright user flows |
| CI + AWS | GitHub Actions, Docker images, ECS, RDS |

## Privacy (say this in interviews)

"The demo uses fictional students only. School data would need school approval and real privacy controls first."
