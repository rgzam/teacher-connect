# ADR 0001 — Modular monolith

## Decision

Build one Next.js app and one NestJS API that share a PostgreSQL database.

## Why

- Faster to finish and explain in interviews than microservices.
- NestJS modules still give clear boundaries (auth, contacts, appointments).
- Docker Compose is enough for local Postgres.

## Not now

Kubernetes, Redis, GraphQL, and extra databases. Add them only when a real bottleneck appears.
