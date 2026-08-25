# Google Calendar setup (local)

Booking works without Google. Connect Calendar when you want Ly’s personal busy times blocked and new bookings added to her calendar.

## 1. Create an OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or pick one).
3. Enable **Google Calendar API**.
4. Go to **APIs & Services → OAuth consent screen**.
   - User type: External
   - Add your Gmail as a test user
5. Go to **Credentials → Create credentials → OAuth client ID**.
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3001/api/calendar/oauth/callback`

## 2. Put the secrets in `.env`

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/oauth/callback
```

Restart `pnpm dev` after saving.

## 3. Connect

Sign in as the teacher → **Schedule** → **Connect Google Calendar**.

## What we ask Google for

- `calendar.freebusy` — busy ranges only, no event titles
- `calendar.events` — create/delete TeacherConnect bookings and a Google Meet link on virtual meetings
- `userinfo.email` — show which Google account is connected

We do **not** ask for full calendar read of event names. Parents never see Google data.
