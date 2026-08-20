# Architecture

TeacherConnect is a **modular monolith**: one frontend app, one backend app, one PostgreSQL database.

```text
Browser
  |
  v
Next.js (apps/web)  ----REST---->  NestJS (apps/api)
                                      |
                                      v
                                   Prisma
                                      |
                                      v
                              PostgreSQL (Docker / later AWS RDS)
```

## Why this shape?

- **Next.js App Router** renders the teacher dashboard and the public parent booking page.
- **NestJS** owns business rules: booking conflicts, contact workflows, auth, Google Calendar.
- **Prisma** keeps TypeScript types aligned with the database schema.
- **Docker Compose** runs Postgres locally so nobody installs a database on their machine.

## Request path (backend)

```text
Controller  ->  Service  ->  Prisma  ->  PostgreSQL
```

- Controllers accept HTTP and validate input (DTOs + `class-validator`).
- Services contain business logic you should be able to explain in an interview.
- Prisma is the only layer that talks to SQL.

## What we are not building yet

Kubernetes, Redis, GraphQL, and microservices. Those are later-only if a real need appears.
