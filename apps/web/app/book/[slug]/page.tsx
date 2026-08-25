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
    return <p className="page p-8 text-[var(--muted)]">{error ?? 'Loading…'}</p>;
  }

  if (confirmation) {
    return (
      <main className="page">
      <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-16">
        <div className="card p-5 sm:p-8">
        <p className="eyebrow">Confirmed</p>
        <h1 data-testid="booking-confirmation" className="mt-2 text-3xl font-semibold">
          You are booked
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {confirmation.typeName} with {teacher.firstName} {teacher.lastName} on{' '}
          {formatDay(confirmation.startsAt, teacher.timezone)} at{' '}
          {formatTime(confirmation.startsAt, teacher.timezone)}.
        </p>
        {confirmation.format === 'VIRTUAL' && confirmation.meetUrl ? (
          <a
            data-testid="meet-link"
            href={confirmation.meetUrl}
            className="btn mt-5"
          >
            Join Google Meet
          </a>
        ) : null}
        {confirmation.format === 'VIRTUAL' && !confirmation.meetUrl ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            This is a video meeting. The teacher will share a Google Meet link.
          </p>
        ) : null}
        {confirmation.format === 'HOME_VISIT' ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Home visit: the teacher will come with a coworker.
          </p>
        ) : null}
        {confirmation.homeVisitAddress ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Address: {confirmation.homeVisitAddress}
          </p>
        ) : null}
        <p className="mt-3 text-sm text-[var(--muted)]">
          If you entered an email, a confirmation is on the way. You will also
          get a reminder about an hour before.
        </p>
        {confirmation.manageToken ? (
          <a
            data-testid="manage-appointment"
            href={`/manage/${confirmation.manageToken}`}
            className="btn-secondary mt-3"
          >
            Change or cancel this appointment
          </a>
        ) : null}
        </div>
      </div>
      </main>
    );
  }

  return (
    <main className="page">
    <div className="mx-auto flex max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-12">
      <div>
        <p className="eyebrow">Book a time</p>
        <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight sm:text-3xl">
          {teacher.firstName} {teacher.lastName}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
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
        <p className="text-sm text-[var(--muted)]">{selectedType.description}</p>
      ) : null}
      {isHomeVisit ? (
        <p data-testid="home-visit-note" className="rounded-xl bg-[var(--pine-soft)] px-3 py-2 text-sm text-[var(--pine)]">
          For a home visit, the teacher comes to you with a coworker.
        </p>
      ) : null}

      <section className="card p-5">
        <h2 className="font-medium">Open times</h2>
        {!slots || slots.days.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">No open times in the booking window.</p>
        ) : (
          <div className="mt-3 grid gap-4">
            {slots.days.map((day) => (
              <div key={day.date}>
                <p className="text-sm font-medium text-[var(--muted)]">
                  {formatDay(`${day.date}T12:00:00.000Z`, teacher.timezone)}
                </p>
                <div className="slot-grid mt-2">
                  {day.slots.map((slot) => {
                    const active = selected?.startsAt === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        data-testid="time-slot"
                        onClick={() => setSelected(slot)}
                        className={`slot ${active ? 'slot-active' : ''}`}
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

      <form onSubmit={onSubmit} className="card grid gap-3 p-5">
        <h2 className="font-medium">Your information</h2>
        <input
          name="guardianFirstName"
          required
          autoComplete="given-name"
          data-testid="guardian-first"
          placeholder="Parent first name"
          className="input"
        />
        <input
          name="guardianLastName"
          required
          autoComplete="family-name"
          data-testid="guardian-last"
          placeholder="Parent last name"
          className="input"
        />
        <label className="grid gap-1 text-sm">
          Email (optional)
          <input
            name="guardianEmail"
            type="email"
            autoComplete="email"
            inputMode="email"
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
            autoComplete="tel"
            inputMode="tel"
            data-testid="guardian-phone"
            placeholder="(555) 555-5555"
            className="input"
          />
        </label>
        <input
          name="studentFirstName"
          required
          autoComplete="off"
          data-testid="student-first"
          placeholder="Student first name"
          className="input"
        />
        <input
          name="studentLastName"
          required
          autoComplete="off"
          data-testid="student-last"
          placeholder="Student last name"
          className="input"
        />
        {isVirtual ? (
          <p className="text-sm text-[var(--muted)]">
            After you book, you will get a Google Meet link on this page.
          </p>
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
        {selected ? (
          <p className="text-sm font-medium text-[var(--pine)]">
            Selected: {formatDay(selected.startsAt, teacher.timezone)} at{' '}
            {formatTime(selected.startsAt, teacher.timezone)}
          </p>
        ) : (
          <p className="text-sm text-[var(--muted)]">Pick a time above, then confirm.</p>
        )}
        <div className="sticky-action">
          <button
            type="submit"
            data-testid="confirm-booking"
            disabled={pending || !selected}
            className="btn"
          >
            {pending ? 'Booking…' : 'Confirm appointment'}
          </button>
        </div>
      </form>
    </div>
    </main>
  );
}
