# TeacherConnect — Full-Stack Project Plan

## Current progress (updated while scaffolding)

**Now building: Phase 10 — AWS. Docker images work locally. Next: account + $10 budget, then ECR.**

What is already running locally:

- Monorepo with `apps/web` (Next.js 16), `apps/api` (NestJS), `packages/types`, and Prisma
- Teacher login, dashboard, contacts, public booking, Google Calendar, email, reminders
- Jest unit tests and Playwright for login + parent booking
- GitHub Actions workflow: lint and Jest, then Playwright

Not started yet: production Docker images, AWS deploy, polish, optional AI.

---

## 1. Project Goal

Build a production-style web application for teachers to manage parent communication, follow-ups, appointments, and scheduling.

The project has two goals:

1. Solve a real problem for a teacher.
2. Demonstrate modern full-stack development skills for software engineering and full-stack developer roles.

The project should be simple and user-friendly for parents while giving the teacher a more powerful dashboard for managing communication.

---

## 2. Product Idea

**Working Name:** TeacherConnect

**Description:**  
A parent communication and scheduling platform that helps teachers manage appointments, parent calls, follow-ups, communication history, and priorities in one place.

Instead of building only a Calendly-style scheduler, the application should answer:

- Who do I need to contact?
- Why do I need to contact them?
- How urgent is it?
- When do I need to contact them?
- Have I already tried to contact them?
- What happened during the last contact?
- Do I need to follow up?
- When am I available for a parent meeting?

---

# 3. Recommended Technology Stack

## Core Language

### TypeScript

Use TypeScript across the frontend and backend.

Why:

- Strong demand in modern web development.
- Works with React, Next.js, Node.js, and NestJS.
- Adds type safety.
- Helps demonstrate modern full-stack skills.

---

## Frontend

### React
### Next.js
### TypeScript

Use Next.js with the App Router.

Responsibilities:

- Teacher dashboard
- Calendar views
- Parent booking page
- Forms
- Contact management
- Analytics
- Authentication UI
- Mobile-friendly interface

---

## UI

### Tailwind CSS
### shadcn/ui

Use these to create a polished interface without spending too much time building basic UI components from scratch.

Important goals:

- Responsive
- Accessible
- Simple
- Fast
- Easy for parents to understand

---

## Backend

### Node.js
### NestJS
### TypeScript

NestJS will handle the backend API and business logic.

Responsibilities:

- Authentication
- Scheduling logic
- Appointment management
- Contact management
- Google Calendar integration
- Notifications
- Priority rules
- Authorization
- Database access
- Validation

NestJS is a good choice because its structure is similar to enterprise Java frameworks.

Expected organization:

```text
Controller
    ↓
Service
    ↓
Repository / Prisma
    ↓
PostgreSQL
```

---

## Database

### PostgreSQL

Use PostgreSQL as the main relational database.

Reasons:

- Excellent industry adoption
- Strong SQL experience for interviews
- Great fit for relational data such as teachers, parents, students, appointments, and contact history

---

## ORM

### Prisma

Use Prisma for:

- Database schema
- Type-safe queries
- Database migrations
- Relationships
- Development productivity

---

## Authentication

Possible choices:

- Auth.js
- Auth0
- Clerk

Preferred starting option:

**Auth.js**

Authentication should eventually support:

- Teacher login
- Admin role
- Public parent scheduling
- Google OAuth for Calendar access

---

## API

### REST API

Use REST initially.

Example routes:

```text
GET    /appointments
POST   /appointments
PATCH  /appointments/:id
DELETE /appointments/:id

GET    /contacts
POST   /contacts

GET    /contact-tasks
POST   /contact-tasks
PATCH  /contact-tasks/:id

GET    /availability
POST   /availability
```

Use:

### OpenAPI / Swagger

This provides documented APIs and gives additional portfolio value.

---

# 4. Cloud and DevOps

## Docker

Use Docker for:

- Frontend
- Backend
- PostgreSQL development environment

Local development example:

```text
docker-compose.yml

services:
  web
  api
  postgres
```

---

## AWS

Target deployment:

### Frontend / API
AWS ECS + Fargate

### Database
Amazon RDS PostgreSQL

### Logging
Amazon CloudWatch

### Secrets
AWS Secrets Manager or Parameter Store

Possible architecture:

```text
Internet
   |
   v
Application Load Balancer
   |
   +----------------+
   |                |
   v                v
Next.js         NestJS API
Container       Container
                    |
                    v
             PostgreSQL RDS
```

---

## CI/CD

### GitHub Actions

Automate:

```text
Push / Pull Request
        |
        v
Install dependencies
        |
        v
Lint
        |
        v
Run tests
        |
        v
Build application
        |
        v
Build Docker image
        |
        v
Deploy
```

---

# 5. Development Environment

Install:

- Cursor
- Git
- GitHub CLI
- Node.js LTS
- pnpm
- Docker Desktop
- DBeaver
- Bruno or Postman
- Claude Code
- AWS CLI
- Figma

---

# 6. AI Development Tools

## Cursor

Primary IDE.

Use Cursor for:

- Writing code
- Understanding the repository
- Refactoring
- Debugging
- Finding references
- Small feature implementation
- Code review

---

## Claude Code

Use Claude Code as a second engineering assistant.

Good use cases:

```text
Review the architecture of this module.

Find potential race conditions.

Review this endpoint for security problems.

Write tests for this scheduling service.

Explain why this Docker container is failing.

Review this pull request before I merge it.
```

Do not rely on AI to build the entire application automatically.

Recommended workflow:

```text
Requirement
    ↓
Design the solution yourself
    ↓
Ask AI to critique the design
    ↓
Implement
    ↓
Write tests
    ↓
Ask AI for code review
    ↓
Review everything yourself
```

The goal is to understand every important part of the system well enough to explain it in an interview.

---

# 7. Main Users

## Teacher

The teacher should be able to:

- Log in
- View appointments
- View today's contact tasks
- View overdue contact tasks
- Add a parent or contact
- Add a student
- Schedule a parent call
- Record communication
- Add follow-ups
- Mark communication complete
- Set priority
- View communication history
- Configure appointment availability
- Connect Google Calendar
- View basic analytics

---

## Parent

The parent experience should be extremely simple.

Parents should be able to:

1. Open a teacher booking link.
2. Choose an appointment type.
3. Choose an available date.
4. Choose an available time.
5. Enter their information.
6. Add an optional reason.
7. Confirm the appointment.
8. Receive confirmation.

Parents should NOT need a complicated dashboard for the MVP.

---

# 8. Core Features

## Teacher Dashboard

Show:

- Today's appointments
- Upcoming appointments
- Parents to contact today
- Overdue contacts
- High-priority contacts
- Recent communication
- Follow-ups
- Quick actions

Possible layout:

```text
--------------------------------------------------
TeacherConnect
--------------------------------------------------

Today's Appointments        Calls To Make
3                           6

Overdue Follow-Ups          High Priority
2                           3

--------------------------------------------------

Today's Schedule

9:00   Class
10:30  Parent Meeting
1:00   Planning
3:30   Parent Call

--------------------------------------------------

Contact Queue

HIGH    Jordan's Parent     Academic Concern
HIGH    Maya's Parent       Follow-Up
NORMAL  Alex's Parent       Positive Call
```

---

# 9. Parent Contact Queue

This is one of the most important features.

Each contact task could contain:

```text
Student
Parent / Guardian
Reason
Priority
Due Date
Status
Number of Attempts
Last Contact Date
Notes
Follow-Up Date
```

---

## Contact Reasons

Examples:

- Academic concern
- Missing assignments
- Attendance
- Behavior
- Positive update
- Student improvement
- General question
- Parent requested contact
- Teacher requested conference
- Other

---

## Priority

Possible values:

```text
URGENT
HIGH
NORMAL
LOW
```

Initially allow the teacher to set priority manually.

Later, priority can also be calculated using business rules.

Example:

```text
Parent requested call
+ overdue
+ multiple failed attempts
= HIGH PRIORITY
```

---

# 10. Contact Status

Possible statuses:

```text
NOT_CONTACTED
ATTEMPTED
REACHED
FOLLOW_UP_REQUIRED
COMPLETED
```

This gives the application a real workflow instead of simple CRUD.

---

# 11. Contact History

Every contact attempt should create a history entry.

Example:

```text
Student: Maya Rodriguez

August 18
Phone Call
Parent reached
Discussed missing homework.
Follow-up needed Friday.

August 15
Phone Call
No answer.
Left voicemail.
```

This provides useful relational database experience.

---

# 12. Scheduling System

Teacher should be able to configure:

- Available days
- Start time
- End time
- Appointment length
- Break between appointments
- Minimum notice
- Maximum booking window
- Blocked dates

Example:

```text
Monday - Thursday

3:30 PM - 5:00 PM

Appointment Duration:
15 minutes

Buffer:
5 minutes

Minimum Notice:
12 hours
```

---

# 13. Appointment Types

Example appointment types:

```text
Quick Parent Call
10 minutes

Parent Conference
20 minutes

Student Progress Meeting
20 minutes

Academic Concern
30 minutes

In-Person Conference
30 minutes
```

---

# 14. Google Calendar Integration

The teacher should be able to connect Google Calendar using OAuth.

The application should:

1. Read busy periods.
2. Compare busy periods with teacher availability.
3. Generate valid appointment slots.
4. Show valid slots to parents.
5. Create a Calendar event after booking.
6. Update the Calendar event if the appointment changes.
7. Remove or update the event after cancellation.

Parents should NOT see the contents of the teacher's personal Calendar.

They should only see available appointment slots.

---

# 15. Booking Conflict Protection

The application must prevent two parents from booking the same appointment.

Example:

```text
Parent A selects 3:30 PM
Parent B selects 3:30 PM

Both click Book
```

Only one request should succeed.

Protect this at the database/backend level, not only in the frontend.

This is a good interview topic involving:

- Transactions
- Unique constraints
- Concurrency
- Race conditions

---

# 16. Suggested Database Entities

Initial entities:

```text
User
Teacher
Student
Guardian
StudentGuardian
Appointment
AppointmentType
Availability
ContactTask
ContactLog
CalendarConnection
Notification
AuditLog
```

---

# 17. Possible Relationships

```text
Teacher
   |
   +---- Students
   |
   +---- Appointments
   |
   +---- ContactTasks
   |
   +---- Availability
   |
   +---- CalendarConnection


Student
   |
   +---- Guardians
   |
   +---- ContactTasks
   |
   +---- ContactLogs


Guardian
   |
   +---- Students
   |
   +---- Appointments
```

---

# 18. MVP Scope

Do NOT build everything immediately.

The MVP should contain:

## Teacher

- Authentication
- Dashboard
- Student/contact list
- Contact tasks
- Priority
- Contact status
- Contact history
- Follow-up date

## Scheduling

- Teacher availability
- Appointment types
- Public booking page
- Appointment creation
- Appointment cancellation
- Appointment rescheduling

## Calendar

- Google OAuth
- Free/busy lookup
- Calendar event creation

## Engineering

- PostgreSQL
- Prisma
- REST API
- Docker
- Tests
- GitHub Actions
- AWS deployment

---

# 19. Features for Later

After the MVP works:

- Email notifications
- SMS notifications
- Daily teacher digest
- Analytics
- Search
- Filtering
- Student tags
- Contact templates
- Export reports
- Multiple teachers
- School administrator
- Multi-school support
- AI communication drafts
- AI priority suggestions

---

# 20. AI Feature

Do not make AI the main feature.

Add it after the core system works.

A useful AI feature could be:

### Parent Message Draft

Teacher selects:

```text
Student
Reason
Tone
Communication Type
```

The application creates a draft such as:

```text
Hello Mrs. Rodriguez,

I wanted to reach out with a quick update about Maya...
```

The teacher must review and approve the message.

Never automatically send AI-generated communication without teacher review.

---

# 21. Security

Important areas:

- Authentication
- Authorization
- Input validation
- Secure cookies
- CSRF protection
- Rate limiting
- Secure OAuth tokens
- Encrypted secrets
- HTTPS
- Audit logging
- Least-privilege permissions

Public booking endpoints should be rate limited.

---

# 22. Privacy

During development and for the public portfolio demo:

**Use completely fictional student and parent information.**

Example demo students:

- Maya Rodriguez
- Jordan Lee
- Alex Martinez
- Sofia Garcia
- Ethan Wilson

Never place real student data in:

- GitHub
- Screenshots
- Demo databases
- Documentation
- Test data
- Public deployments

If the application is eventually used with real school/student information, the school should approve the application and data-handling process first.

---

# 23. Testing Strategy

## Unit Tests

Test:

- Scheduling rules
- Priority calculation
- Appointment validation
- Contact status transitions
- Availability calculation

---

## Integration Tests

Test:

- API + PostgreSQL
- Authentication
- Appointment creation
- Contact task creation
- Calendar service

---

## End-to-End Tests

Use Playwright.

Important flows:

```text
Parent books appointment
Teacher views appointment
Teacher cancels appointment
Parent reschedules appointment

Teacher creates contact task
Teacher records contact attempt
Teacher creates follow-up
Teacher completes task

Two users attempt same appointment slot
Only one booking succeeds
```

---

# 24. Development Phases

## Phase 1 — Product Planning

Before coding:

- Define users
- Define MVP
- Write user stories
- Create wireframes
- Design database
- Create architecture diagram
- Create GitHub repository
- Create GitHub Project board

---

## Phase 2 — Application Foundation

Create:

```text
Next.js frontend
NestJS backend
PostgreSQL
Prisma
Docker Compose
Environment configuration
Authentication
```

Goal:

Frontend successfully communicates with backend and database.

---

## Phase 3 — Teacher Dashboard

Build:

- Navigation
- Dashboard
- Today's appointments
- Today's calls
- Overdue tasks
- Priority tasks
- Recent activity

---

## Phase 4 — Contact Management

Build:

- Students
- Guardians
- Contact tasks
- Priority
- Due dates
- Contact reasons
- Contact logs
- Follow-ups
- Status workflow

This is one of the most important phases.

---

## Phase 5 — Scheduling

Build:

- Availability
- Appointment types
- Booking slots
- Parent booking page
- Confirmation
- Cancellation
- Rescheduling

---

## Phase 6 — Google Calendar

Build:

- Google OAuth
- Calendar connection
- Free/busy lookup
- Conflict detection
- Event creation
- Event updates
- Event cancellation

---

## Phase 7 — Notifications

Add:

- Appointment confirmation
- Appointment reminders
- Cancellation notification
- Teacher daily summary

Email can be implemented before SMS.

---

## Phase 8 — Testing and Security

Add:

- Unit tests
- Integration tests
- Playwright tests
- Validation
- Authorization
- Rate limiting
- Error handling
- Logging

---

## Phase 9 — Docker and CI/CD

Create:

- Production Dockerfiles
- Docker Compose
- GitHub Actions

Pipeline:

```text
Pull Request
    |
    v
Lint
    |
    v
Tests
    |
    v
Build
```

After merge:

```text
Build Docker Images
    |
    v
Push Images
    |
    v
Deploy to AWS
```

---

## Phase 10 — AWS Deployment

Deploy:

```text
Next.js
   |
   v
AWS ECS / Fargate

NestJS
   |
   v
AWS ECS / Fargate

PostgreSQL
   |
   v
Amazon RDS

Logs
   |
   v
CloudWatch
```

---

## Phase 11 — Polish

Improve:

- Mobile experience
- Loading states
- Error messages
- Empty states
- Accessibility
- Performance
- UI consistency
- README
- Screenshots
- Architecture documentation

---

## Phase 12 — Optional AI

After everything else works:

- Parent communication drafts
- Contact-summary drafts
- Suggested follow-up
- Priority explanation

---

# 25. Suggested Repository Structure

```text
teacher-connect/
│
├── apps/
│   │
│   ├── web/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   │
│   └── api/
│       ├── src/
│       │   ├── auth/
│       │   ├── appointments/
│       │   ├── availability/
│       │   ├── calendar/
│       │   ├── contacts/
│       │   ├── students/
│       │   └── users/
│       │
│       └── test/
│
├── packages/
│   ├── ui/
│   └── types/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── README.md
└── PROJECT_PLAN.md
```

---

# 26. Suggested Learning Priorities

Approximate learning effort:

```text
30% React + TypeScript + Next.js
20% Node.js + NestJS + API Design
15% PostgreSQL + SQL + Data Modeling
10% Docker
10% AWS
 5% Testing
 5% CI/CD
 5% OAuth + Security + Integrations
```

Do not wait until you master a technology before using it.

Learn it when the project requires it.

---

# 27. Git Workflow

Use professional Git practices.

Example:

```text
main
 |
 +--- feature/contact-tasks
 |
 +--- feature/teacher-dashboard
 |
 +--- feature/google-calendar
 |
 +--- fix/booking-conflict
```

Each feature should ideally have:

1. GitHub issue
2. Feature branch
3. Implementation
4. Tests
5. Pull request
6. Code review
7. Merge

Even when working alone, follow this process because it gives you real workflow experience.

---

# 28. Documentation

The repository should eventually contain:

```text
README.md
PROJECT_PLAN.md
ARCHITECTURE.md
DATABASE.md
API.md
DEPLOYMENT.md
```

The README should eventually include:

- Project description
- Screenshots
- Demo link
- Architecture diagram
- Tech stack
- Local setup instructions
- Testing instructions
- Major engineering decisions

---

# 29. Important Engineering Topics to Learn From This Project

Be able to explain these in interviews:

### Frontend

- Server vs client components
- React state
- Forms
- Validation
- Data fetching
- Loading/error states
- Responsive design

### Backend

- Controllers
- Services
- Dependency injection
- DTOs
- Validation
- Authentication
- Authorization
- REST design
- Error handling

### Database

- Primary keys
- Foreign keys
- Indexes
- Transactions
- Unique constraints
- Many-to-many relationships
- Migrations

### System Design

- Scheduling conflicts
- Race conditions
- Caching
- Authentication
- OAuth
- API integrations
- Background jobs
- Scaling

### DevOps

- Docker
- CI/CD
- Environment variables
- AWS
- Logging
- Monitoring

---

# 30. Technologies NOT to Add Initially

Avoid adding technology only because it sounds impressive.

Do NOT initially add:

- Kubernetes
- Kafka
- Microservices
- MongoDB
- Redis
- GraphQL
- WebSockets
- Multiple databases
- Multiple backend languages

Build a strong modular monolith first.

Add new technology only when the application has a real reason for it.

---

# 31. Resume Goal

The finished project should demonstrate:

```text
TypeScript
React
Next.js
Node.js
NestJS
PostgreSQL
Prisma
REST APIs
OAuth
Google Calendar API
Docker
AWS
GitHub Actions
Automated Testing
CI/CD
Authentication
Authorization
Responsive UI
Production Deployment
```

Possible future resume entry:

## TeacherConnect — Full-Stack Parent Communication & Scheduling Platform

Designed and deployed a full-stack web application using React, Next.js, TypeScript, Node.js, NestJS, PostgreSQL, and AWS to manage parent communication, prioritized follow-ups, and appointment scheduling.

Integrated Google Calendar OAuth and API functionality for real-time availability and automated event creation.

Implemented REST APIs, role-based authorization, relational database design, Dockerized services, automated testing, and GitHub Actions CI/CD.

---

# 32. Success Criteria

The project is successful when:

- A teacher can log in.
- A teacher can create and manage parent contact tasks.
- A teacher can record contact history.
- A teacher can schedule follow-ups.
- A teacher can manage availability.
- A parent can book an appointment.
- Google Calendar conflicts are respected.
- Double booking is prevented.
- The app works well on mobile and desktop.
- Automated tests cover important workflows.
- CI runs automatically.
- The app is deployed publicly.
- The repository has strong documentation.
- You can explain every major architectural decision in an interview.

---

# 33. Final Project Strategy

The goal is NOT to build the largest application possible.

The goal is to build a:

**small, polished, secure, tested, deployed production-style application with real users and real business logic.**

Priority:

```text
Working Product
    >
Strong Architecture
    >
Testing
    >
Deployment
    >
Documentation
    >
Extra Features
```

A finished application using a focused modern stack is more valuable than an unfinished application containing many technologies.
