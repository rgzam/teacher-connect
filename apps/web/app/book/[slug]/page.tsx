'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { bookPublic, getPublicSlots, getPublicTeacher } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/labels';
import type {
  BookedAppointment,
  PublicSlot,
  PublicSlotsResponse,
  PublicTeacher,
} from '@teacher-connect/types';

export default function PublicBookPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [teacher, setTeacher] = useState<PublicTeacher | null>(null);
  const [slots, setSlots] = useState<PublicSlotsResponse | null>(null);
  const [typeId, setTypeId] = useState('');
  const [selected, setSelected] = useState<PublicSlot | null>(null);
  const [confirmation, setConfirmation] = useState<BookedAppointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedType = teacher?.types.find((type) => type.id === typeId);
  const isHomeVisit = selectedType?.format === 'HOME_VISIT';
  const isVirtual = selectedType?.format === 'VIRTUAL';

  useEffect(() => {
    if (!slug) {
      return;
    }

    void getPublicTeacher(slug)
      .then((data) => {
        setTeacher(data);
        const firstType = data.types[0]?.id ?? '';
        setTypeId(firstType);
      })
      .catch(() => setError('This booking link is not available.'));
  }, [slug]);

  useEffect(() => {
    if (!slug || !typeId) {
      return;
    }

    void getPublicSlots(slug, typeId)
      .then(setSlots)
      .catch(() => setError('Could not load open times.'));
  }, [slug, typeId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError('Please choose a time.');
      return;
    }

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const booked = await bookPublic(slug, {
        appointmentTypeId: typeId,
        startsAt: selected.startsAt,
        guardianFirstName: String(form.get('guardianFirstName') ?? ''),
        guardianLastName: String(form.get('guardianLastName') ?? ''),
        guardianEmail: String(form.get('guardianEmail') ?? '') || undefined,
        guardianPhone: String(form.get('guardianPhone') ?? '') || undefined,
        studentFirstName: String(form.get('studentFirstName') ?? ''),
        studentLastName: String(form.get('studentLastName') ?? ''),
        virtualMeetingName: String(form.get('virtualMeetingName') ?? '') || undefined,
        homeVisitAddress: String(form.get('homeVisitAddress') ?? '') || undefined,
        reason: String(form.get('reason') ?? '') || undefined,
      });
      setConfirmation(booked);
    } catch (bookingError) {
      setError(
        bookingError instanceof Error
          ? bookingError.message
          : 'Could not complete the booking.',
      );
    } finally {
      setPending(false);
    }
  }

  if (!teacher) {
    return <p className="p-8 text-zinc-500">{error ?? 'Loading…'}</p>;
  }

  if (confirmation) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 data-testid="booking-confirmation" className="text-3xl font-semibold">
          You are booked
        </h1>
        <p className="mt-3 text-zinc-600">
          {confirmation.typeName} with {teacher.firstName} {teacher.lastName} on{' '}
          {formatDay(confirmation.startsAt, teacher.timezone)} at{' '}
          {formatTime(confirmation.startsAt, teacher.timezone)}.
        </p>
        {confirmation.virtualMeetingName ? (
          <p className="mt-2 text-sm text-zinc-600">
            Virtual meeting name: {confirmation.virtualMeetingName}
          </p>
        ) : null}
        {confirmation.format === 'HOME_VISIT' ? (
          <p className="mt-2 text-sm text-zinc-600">
            Home visit: the teacher will come with a coworker.
          </p>
        ) : null}
        {confirmation.homeVisitAddress ? (
          <p className="mt-2 text-sm text-zinc-600">
            Address: {confirmation.homeVisitAddress}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-zinc-500">
          If you entered an email, a confirmation is on the way. You will also
          get a reminder about an hour before.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-6 py-12">
      <div>
        <p className="text-sm text-zinc-500">Book a time</p>
        <h1 className="text-3xl font-semibold">
          {teacher.firstName} {teacher.lastName}
        </h1>
        <p className="mt-2 text-zinc-600">
          Choose virtual or a home visit, then pick an open time.
        </p>
      </div>

      <label className="grid gap-1 text-sm">
        Meeting type
        <select
          data-testid="meeting-type"
          value={typeId}
          onChange={(event) => {
            setTypeId(event.target.value);
            setSelected(null);
          }}
          className="input"
        >
          {teacher.types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.durationMinutes} min)
            </option>
          ))}
        </select>
      </label>
      {selectedType?.description ? (
        <p className="text-sm text-zinc-600">{selectedType.description}</p>
      ) : null}
      {isHomeVisit ? (
        <p data-testid="home-visit-note" className="text-sm text-zinc-600">
          For a home visit, the teacher comes to you with a coworker.
        </p>
      ) : null}

      <section>
        <h2 className="font-medium">Open times</h2>
        {!slots || slots.days.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No open times in the booking window.</p>
        ) : (
          <div className="mt-3 grid gap-4">
            {slots.days.map((day) => (
              <div key={day.date}>
                <p className="text-sm font-medium text-zinc-500">
                  {formatDay(`${day.date}T12:00:00.000Z`, teacher.timezone)}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {day.slots.map((slot) => {
                    const active = selected?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        data-testid="time-slot"
                        onClick={() => setSelected(slot)}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${
                          active
                            ? 'border-zinc-900 bg-zinc-900 text-white'
                            : 'border-zinc-300 bg-white'
                        }`}
                      >
                        {formatTime(slot.startsAt, teacher.timezone)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={onSubmit} className="grid gap-3">
        <h2 className="font-medium">Your information</h2>
        <input
          name="guardianFirstName"
          required
          data-testid="guardian-first"
          placeholder="Parent first name"
          className="input"
        />
        <input
          name="guardianLastName"
          required
          data-testid="guardian-last"
          placeholder="Parent last name"
          className="input"
        />
        <label className="grid gap-1 text-sm">
          Email (optional)
          <input
            name="guardianEmail"
            type="email"
            data-testid="guardian-email"
            placeholder="you@example.com"
            className="input"
          />
        </label>
        <label className="grid gap-1 text-sm">
          Phone (optional)
          <input
            name="guardianPhone"
            type="tel"
            data-testid="guardian-phone"
            placeholder="(555) 555-5555"
            className="input"
          />
        </label>
        <input
          name="studentFirstName"
          required
          data-testid="student-first"
          placeholder="Student first name"
          className="input"
        />
        <input
          name="studentLastName"
          required
          data-testid="student-last"
          placeholder="Student last name"
          className="input"
        />
        {isVirtual ? (
          <label className="grid gap-1 text-sm">
            Virtual meeting name
            <input
              name="virtualMeetingName"
              required
              data-testid="virtual-meeting-name"
              placeholder="Name to show on the video call"
              className="input"
            />
          </label>
        ) : null}
        {isHomeVisit ? (
          <label className="grid gap-1 text-sm">
            Home address (optional)
            <input
              name="homeVisitAddress"
              data-testid="home-visit-address"
              placeholder="You can share this later if needed"
              className="input"
            />
          </label>
        ) : null}
        <textarea name="reason" placeholder="Reason (optional)" className="input min-h-20" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          data-testid="confirm-booking"
          disabled={pending || !selected}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Booking…' : 'Confirm appointment'}
        </button>
      </form>
    </main>
  );
}
