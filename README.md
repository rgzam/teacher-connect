# TeacherConnect

A parent communication and scheduling platform for teachers.

This repo is a TypeScript monorepo:

- `apps/web` — Next.js teacher dashboard and parent booking UI
- `apps/api` — NestJS REST API
- `packages/types` — shared TypeScript types
- `prisma` — PostgreSQL schema and seed data

The full product plan is in `TeacherConnect_PROJECT_PLAN.md`.
Career / interview study notes: `docs/learning.md`.

## Prerequisites

- Node.js 20+
- pnpm
- Docker Desktop

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Then open:

- Frontend: http://localhost:3000
- API health: http://localhost:3001/api/health
- Swagger: http://localhost:3001/api/docs
- Prisma Studio: `pnpm db:studio`

Demo login (after seed):

- Email: `teacher@teacherconnect.dev`
- Password: `DemoPass123!`

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start Next.js and NestJS together |
| `pnpm db:up` | Start local PostgreSQL in Docker |
| `pnpm db:migrate` | Create / apply database migrations |
| `pnpm db:seed` | Insert fictional demo data |
| `pnpm test` | Run API unit tests |

## Current phase

Phase 2 — Application Foundation. The goal is: frontend talks to backend, backend talks to PostgreSQL.
