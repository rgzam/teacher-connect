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

## Login — say these out loud

### Authentication vs authorization
- **Authentication**: prove who you are (email + password).
- **Authorization**: what you are allowed to do (teacher vs admin vs public parent booking).

We only did authentication plus a locked `/api/auth/me` route. Role checks come later.

### Why we hash passwords
The database stores `passwordHash`, never the real password. `bcrypt.compare` checks a login attempt. If the database leaks, attackers do not get usable passwords.

### JWT in an httpOnly cookie
After login, the API sets `tc_session`. `httpOnly` means JavaScript cannot read it, which blocks a common XSS theft path. We do not put the token in `localStorage`.

Interview line: "The API checks email and password, then stores a JWT in an httpOnly cookie. Protected routes use a NestJS guard. The client never sees the raw token."

### Same error for bad email and bad password
We say "Invalid email or password" for both cases so attackers cannot fish for valid emails.

### Rate limiting
Login is limited to 10 tries per minute so a script cannot guess passwords quickly.

## Dashboard — say these out loud

### One aggregated endpoint
The page calls `GET /api/dashboard` once. The API counts appointments, overdue tasks, and recent logs. The browser does not make four separate list requests. That is a **read model**: data shaped for a screen.

### Authorization uses the session, not a query string
We load the teacher from the logged-in user. There is no `?teacherId=`. If we took teacherId from the URL, another teacher could try to read someone else's queue.

Interview line: "The dashboard is scoped to the teacher in the JWT. The client cannot pick another teacher's data."

### Timezones
Appointments are stored in UTC. "Today" is calculated in the teacher's timezone (`America/Denver`). A 3:30 PM meeting in Denver is a different UTC timestamp than 3:30 PM in New York.

### Empty states
A finished product shows a helpful message when a list is empty, not a blank white box.

## Contacts — say these out loud

### This is a workflow, not a to-do checkbox
A contact task has statuses: not contacted → attempted → reached / follow-up → completed. Each phone call writes a **history row**. Completing the task does not delete the past attempts.

Interview line: "I modeled parent outreach as a state machine with an append-only contact log, so teachers can see what they already tried."

### Transactions
Adding a student + guardian, or saving a call + updating the task, happens in `prisma.$transaction`. Either both writes succeed, or neither does. You do not want a log without an updated status.

### Still scoped to the logged-in teacher
`GET /contacts/:id` looks up the task by id **and** `teacherId`. A guessed UUID from another teacher returns 404.

## Scheduling — say these out loud

### Parents see slots, not the calendar
The public page `/book/ly-le` only returns open times. It never returns what Ly already has on her calendar. That is a privacy requirement.

### Recompute the slot on the server
The browser can send any `startsAt`. The API generates valid slots again and rejects times that are not in that list. Never trust the client.

### Unique constraint + transaction
Two parents can click the same 3:30 slot. The API uses a transaction. A partial unique index on confirmed `(teacherId, startsAt)` makes the second write fail. We return 409: pick another time.

Interview line: "Double-booking is prevented in the database, not only in the UI. If two requests race, only one confirmed appointment is stored."

### Cancel frees the slot
Cancelled appointments are not confirmed, so that start time can be offered again.

## Google Calendar — say these out loud

### OAuth 2.0 is “permission,” not “our password”
Ly clicks Connect. Google asks if TeacherConnect may see **busy times** and create **booking events**. Google gives us tokens. We never see her Google password.

### Refresh token
The access token expires. The refresh token lets the API get a new access token without asking Ly to click Connect every hour.

### Least privilege + free/busy
We request `calendar.freebusy` and `calendar.events`, not full calendar read. Free/busy returns “busy from 3:30 to 4:00,” not “Dentist.” Parents still only get open slots.

### Booking still works if Google is down
If Calendar is not connected, or Google fails, the parent can still book. The appointment is stored in our database first.

Interview line: "I used OAuth with the smallest Calendar scopes and the free/busy API so parents never see personal event titles."

## Email — say these out loud

### Booking is the source of truth, email is extra
Save the appointment first. Then send mail. If Gmail/SMTP is down, the parent is still booked. Same idea as Google Calendar.

### Confirmation, not marketing
We send “you are booked” and a teacher ping. We do not send ads. School software should be boring and reliable.

Interview line: "Email is a side effect after a successful transaction. A failed send does not roll back the booking."

## Reminders and Playwright — say these out loud

### Cron is a loop, not a button
A NestJS `@Cron` job runs every minute and asks: “Which confirmed meetings start in the next hour and have not been reminded yet?” That is a **scheduled job**. If the API restarts, the next tick still finds those rows because we store `reminderSentAt` on the appointment.

Interview line: "Reminders are idempotent. We mark the appointment after the send so the same meeting does not get two emails."

### Playwright vs Jest
Jest tests a function (`shouldSendReminder`) with fake dates. Playwright opens a real browser and clicks the booking page. Unit tests are fast. E2E tests prove the parent form still works after we change validation.

Interview line: "I used Jest for the reminder rule and Playwright for the parent booking flow, including required student names and virtual vs home visit."

## CI — say these out loud

### A robot runs the tests you already have
GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request. Lint and Jest go first. Playwright runs only if those pass. You do not rely on remembering `pnpm test:e2e` on your laptop.

Interview line: "CI is the same commands I run locally, on a clean machine, so a broken booking form fails the pull request."

### Why Playwright is a second job
Playwright needs Postgres, a seed, and a built app. That is slower and more expensive. Fast jobs fail first.

### CI has no inbox
If `SMTP_HOST` is empty on GitHub, we do not call Ethereal. Email is a side effect. Booking still has to succeed.

## Docker — say these out loud

### An image is the app plus its runtime
`pnpm dev` uses whatever Node is on your Mac. A Dockerfile starts from `node:22-alpine`, installs dependencies, builds, and copies only the result. The same image can run on your laptop and later on AWS.

Interview line: "I used multi-stage Docker builds. The first stage compiles the app. The last stage only starts the built API or `next start`."

### Why two images
The Next.js UI and the NestJS API are different processes. They scale and fail separately. Compose starts Postgres, then the API (it runs migrations), then the web app.

### Browser vs container network
The parent’s browser talks to `localhost:3000`. Inside Docker, the web container reaches the API at `http://api:3001`. That internal URL is `API_INTERNAL_URL`. We do not put it in the JavaScript sent to the browser.

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
