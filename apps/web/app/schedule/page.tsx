'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { disconnectCalendar, getSchedule, saveAvailability, startCalendarConnect } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import type { ScheduleWindow, TeacherSchedule } from '@teacher-connect/types';

const DAYS = [
  { dayOfWeek: 1, label: 'Monday' },
  { dayOfWeek: 2, label: 'Tuesday' },
  { dayOfWeek: 3, label: 'Wednesday' },
  { dayOfWeek: 4, label: 'Thursday' },
  { dayOfWeek: 5, label: 'Friday' },
  { dayOfWeek: 6, label: 'Saturday' },
  { dayOfWeek: 0, label: 'Sunday' },
];

export default function SchedulePage() {
  return (
    <Suspense fallback={<p className="p-8 text-zinc-500">Loading…</p>}>
      <ScheduleForm />
    </Suspense>
  );
}

function ScheduleForm() {
  const searchParams = useSearchParams();
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [schedule, setSchedule] = useState<TeacherSchedule | null>(null);
  const [windows, setWindows] = useState<ScheduleWindow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (loading) {
      return;
    }

    void getSchedule()
      .then((data) => {
        setSchedule(data);
        setWindows(data.windows);
      })
      .catch(() => setError('Could not load schedule.'));
  }, [loading]);

  function toggleDay(dayOfWeek: number, checked: boolean) {
    if (checked) {
      setWindows((current) => [
        ...current.filter((window) => window.dayOfWeek !== dayOfWeek),
        { dayOfWeek, startTime: '15:30', endTime: '17:00' },
      ]);
      return;
    }

    setWindows((current) => current.filter((window) => window.dayOfWeek !== dayOfWeek));
  }

  function updateWindow(dayOfWeek: number, field: 'startTime' | 'endTime', value: string) {
    setWindows((current) =>
      current.map((window) =>
        window.dayOfWeek === dayOfWeek ? { ...window, [field]: value } : window,
      ),
    );
  }

  async function onSave() {
    setPending(true);
    setError(null);
    try {
      const updated = await saveAvailability(windows);
      setSchedule(updated);
      setWindows(updated.windows);
    } catch {
      setError('Could not save availability.');
    } finally {
      setPending(false);
    }
  }

  if (loading || !schedule) {
    return <p className="p-8 text-zinc-500">{error ?? 'Loading…'}</p>;
  }

  const bookingPath = `/book/${schedule.bookingSlug}`;

  return (
    <main className="min-h-full bg-zinc-50">
      <AppHeader teacherName={teacherName} onLogout={() => void onLogout()} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Availability</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Parents only see open slots, never your personal calendar.
          </p>
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Google Calendar</h2>
          {searchParams.get('calendar') === 'connected' ? (
            <p className="mt-2 text-sm text-emerald-700">Calendar connected.</p>
          ) : null}
          {searchParams.get('calendar') === 'error' ? (
            <p className="mt-2 text-sm text-red-700">Could not connect Google Calendar.</p>
          ) : null}
          {!schedule.calendar.configured ? (
            <p className="mt-2 text-sm text-zinc-600">
              Add Google OAuth keys to <code>.env</code> first. See{' '}
              <code>docs/google-calendar.md</code>.
            </p>
          ) : schedule.calendar.connected ? (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <p>Connected as {schedule.calendar.email}</p>
              <button
                type="button"
                className="underline"
                onClick={() => {
                  void disconnectCalendar().then(() =>
                    getSchedule().then((data) => {
                      setSchedule(data);
                      setWindows(data.windows);
                    }),
                  );
                }}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              onClick={() => {
                void startCalendarConnect().then(({ url }) => {
                  window.location.href = url;
                });
              }}
            >
              Connect Google Calendar
            </button>
          )}
          <p className="mt-3 text-sm text-zinc-500">
            Parents still only see open slots. We use Google’s free/busy API, not event titles.
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Parent booking link</h2>
          <p className="mt-2 text-sm">
            <Link href={bookingPath} className="underline">
              {bookingPath}
            </Link>
          </p>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Weekly hours</h2>
          <ul className="mt-4 grid gap-3">
            {DAYS.map((day) => {
              const window = windows.find((item) => item.dayOfWeek === day.dayOfWeek);
              return (
                <li key={day.dayOfWeek} className="flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex w-28 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(window)}
                      onChange={(event) => toggleDay(day.dayOfWeek, event.target.checked)}
                    />
                    {day.label}
                  </label>
                  {window ? (
                    <>
                      <input
                        type="time"
                        value={window.startTime}
                        onChange={(event) =>
                          updateWindow(day.dayOfWeek, 'startTime', event.target.value)
                        }
                        className="input max-w-32"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={window.endTime}
                        onChange={(event) =>
                          updateWindow(day.dayOfWeek, 'endTime', event.target.value)
                        }
                        className="input max-w-32"
                      />
                    </>
                  ) : (
                    <span className="text-zinc-400">Unavailable</span>
                  )}
                </li>
              );
            })}
          </ul>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={pending}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? 'Saving…' : 'Save hours'}
          </button>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">Appointment types</h2>
          <ul className="mt-3 text-sm text-zinc-700">
            {schedule.types.map((type) => (
              <li key={type.id}>
                {type.name} · {type.durationMinutes} minutes ·{' '}
                {type.format === 'HOME_VISIT' ? 'home visit' : 'virtual'}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
