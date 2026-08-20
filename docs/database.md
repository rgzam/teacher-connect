# Database

PostgreSQL is the source of truth. The schema lives in `prisma/schema.prisma`.

## Core relationships

```text
User 1---1 Teacher
Teacher 1---* Student
Teacher 1---* Guardian
Student *---* Guardian   (StudentGuardian join table)
Teacher 1---* ContactTask ---* ContactLog
Teacher 1---* Appointment
Teacher 1---1 CalendarConnection
```

## Interview-ready details

- **Unique constraint** `Appointment(teacherId, startsAt)` stops two parents booking the same slot.
- **Enums** (`ContactStatus`, `ContactPriority`) model a real workflow, not just CRUD flags.
- **Many-to-many** `StudentGuardian` lets one parent have multiple children.
- **AuditLog** records who changed what, which matters for school software.

## Demo data rule

Seed and screenshots must use fictional names only (Maya Rodriguez, Jordan Lee, and the other demo students in the project plan). Never commit real student information.
