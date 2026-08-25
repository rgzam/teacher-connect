'use client';

import { useEffect, useState } from 'react';
import { cancelAppointment, listAppointments } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import { formatDay, formatTime } from '@/lib/labels';
import type { BookedAppointment, TeacherAppointmentsResponse } from '@teacher-connect/types';

export default function AppointmentsPage() {
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [data, setData] = useState<TeacherAppointmentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    void listAppointments()
      .then(setData)
      .catch(() => setError('Could not load appointments.'));
  }, [loading]);

  async function onCancel(appointment: BookedAppointment) {
    await cancelAppointment(appointment.id);
    const refreshed = await listAppointments();
    setData(refreshed);
  }

  if (loading || !data) {
    return <p className="p-8 text-zinc-500">{error ?? 'Loading…'}</p>;
  }

  return (
    <main className="min-h-full bg-zinc-50">
      <AppHeader teacherName={teacherName} onLogout={() => void onLogout()} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        {data.appointments.length === 0 ? (
          <p className="text-sm text-zinc-500">No upcoming confirmed appointments.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
            {data.appointments.map((appointment) => (
              <li key={appointment.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{appointment.typeName}</p>
                  <p className="text-sm text-zinc-600">
                    {formatDay(appointment.startsAt, data.timezone)}{' '}
                    {formatTime(appointment.startsAt, data.timezone)}
                    {appointment.guardianName ? ` · ${appointment.guardianName}` : ''}
                    {appointment.studentName ? ` · ${appointment.studentName}` : ''}
                  </p>
                  {appointment.format === 'HOME_VISIT' ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      Home visit — go with a coworker
                      {appointment.homeVisitAddress
                        ? ` · ${appointment.homeVisitAddress}`
                        : ''}
                    </p>
                  ) : null}
                  {appointment.virtualMeetingName ? (
                    <p className="mt-1 text-sm text-zinc-500">
                      Meeting name: {appointment.virtualMeetingName}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => void onCancel(appointment)}
                  className="text-sm text-red-700 underline"
                >
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
