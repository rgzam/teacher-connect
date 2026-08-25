'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  cancelPublicAppointment,
  getPublicAppointment,
  getPublicSlots,
  reschedulePublicAppointment,
} from '@/lib/api';
import { formatDay, formatTime } from '@/lib/labels';
import type { BookedAppointment, PublicSlot, PublicSlotsResponse } from '@teacher-connect/types';

export default function ManageAppointmentPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [appointment, setAppointment] = useState<BookedAppointment | null>(null);
  const [slots, setSlots] = useState<PublicSlotsResponse | null>(null);
  const [selected, setSelected] = useState<PublicSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    void getPublicAppointment(token)
      .then(async (data) => {
        setAppointment(data);
        if (data.status === 'CONFIRMED' && data.bookingSlug && data.appointmentTypeId) {
          const open = await getPublicSlots(data.bookingSlug, data.appointmentTypeId);
          setSlots(open);
        }
      })
      .catch(() => setError('This appointment link is not valid.'));
  }, [token]);

  async function onCancel() {
    setPending(true);
    setError(null);
    try {
      const updated = await cancelPublicAppointment(token);
      setAppointment(updated);
    } catch {
      setError('Could not cancel this appointment.');
    } finally {
      setPending(false);
    }
  }

  async function onReschedule() {
    if (!selected) {
      setError('Please choose a new time.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      const updated = await reschedulePublicAppointment(token, selected.startsAt);
      setAppointment(updated);
      setSelected(null);
      if (updated.bookingSlug && updated.appointmentTypeId) {
        const open = await getPublicSlots(updated.bookingSlug, updated.appointmentTypeId);
        setSlots(open);
      }
    } catch (rescheduleError) {
      setError(
        rescheduleError instanceof Error
          ? rescheduleError.message
          : 'Could not move this appointment.',
      );
    } finally {
      setPending(false);
    }
  }

  if (!appointment) {
    return <p className="page p-8 text-[var(--muted)]">{error ?? 'Loading…'}</p>;
  }

  const timezone = appointment.timezone ?? 'America/Denver';
  const cancelled = appointment.status !== 'CONFIRMED';

  return (
    <main className="page">
      <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <p className="eyebrow">Your appointment</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {cancelled ? 'This time was canceled' : 'Change or cancel'}
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            {appointment.typeName} on {formatDay(appointment.startsAt, timezone)} at{' '}
            {formatTime(appointment.startsAt, timezone)}.
          </p>
          {appointment.meetUrl ? (
            <a href={appointment.meetUrl} className="btn mt-4">
              Join Google Meet
            </a>
          ) : null}
        </div>

        {cancelled ? (
          <a href={`/book/${appointment.bookingSlug ?? 'ly-le'}`} className="btn">
            Book a new time
          </a>
        ) : (
          <>
            <section className="card p-5">
              <h2 className="font-medium">Pick a new time</h2>
              {!slots || slots.days.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  No other open times in the booking window.
                </p>
              ) : (
                <div className="mt-3 grid gap-4">
                  {slots.days.map((day) => (
                    <div key={day.date}>
                      <p className="text-sm font-medium text-[var(--muted)]">
                        {formatDay(`${day.date}T12:00:00.000Z`, timezone)}
                      </p>
                      <div className="slot-grid mt-2">
                        {day.slots.map((slot) => {
                          const active = selected?.startsAt === slot.startsAt;
                          return (
                            <button
                              key={slot.startsAt}
                              type="button"
                              onClick={() => setSelected(slot)}
                              className={`slot ${active ? 'slot-active' : ''}`}
                            >
                              {formatTime(slot.startsAt, timezone)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
              <button
                type="button"
                data-testid="reschedule-appointment"
                disabled={pending || !selected}
                onClick={() => void onReschedule()}
                className="btn mt-4"
              >
                {pending ? 'Saving…' : 'Save new time'}
              </button>
            </section>

            <button
              type="button"
              data-testid="cancel-appointment"
              disabled={pending}
              onClick={() => void onCancel()}
              className="btn-secondary"
            >
              Cancel this appointment
            </button>
          </>
        )}
      </div>
    </main>
  );
}
