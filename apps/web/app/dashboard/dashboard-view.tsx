import Link from 'next/link';
import type { DashboardResponse } from '@teacher-connect/types';
import { AppHeader } from '@/components/app-header';
import {
  CONTACT_PRIORITY_LABELS,
  CONTACT_REASON_LABELS,
  CONTACT_STATUS_LABELS,
  formatDay,
  formatTime,
} from '@/lib/labels';

const priorityClass: Record<string, string> = {
  URGENT: 'bg-[var(--danger-soft)] text-[var(--danger)]',
  HIGH: 'bg-[var(--warn-soft)] text-[var(--warn)]',
  NORMAL: 'bg-[var(--pine-soft)] text-[var(--pine)]',
  LOW: 'bg-[var(--paper)] text-[var(--muted)]',
};

export function DashboardView({
  dashboard,
  onLogout,
}: {
  dashboard: DashboardResponse;
  onLogout: () => void;
}) {
  const { teacher, counts, todayAppointments, upcomingAppointments, contactQueue, recentActivity } =
    dashboard;
  const name = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <main className="page">
      <AppHeader teacherName={name} onLogout={onLogout} />

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <p className="eyebrow">Today</p>
          <h1 className="mt-1 text-2xl font-semibold">Here is what needs you</h1>
        </div>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's appointments" value={counts.appointmentsToday} />
          <StatCard label="Calls to make" value={counts.callsToMake} />
          <StatCard label="Overdue follow-ups" value={counts.overdueFollowUps} emphasize={counts.overdueFollowUps > 0} />
          <StatCard label="High priority" value={counts.highPriority} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Today&apos;s schedule</h2>
            {todayAppointments.length === 0 ? (
              <EmptyState text="No parent meetings on the calendar today." />
            ) : (
              <ul className="mt-4 divide-y divide-[var(--line)]">
                {todayAppointments.map((appointment) => (
                  <li key={appointment.id} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                    <p className="w-20 shrink-0 text-sm font-medium text-[var(--pine)]">
                      {formatTime(appointment.startsAt, teacher.timezone)}
                    </p>
                    <div>
                      <p className="font-medium">{appointment.typeName}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {appointment.studentName}
                        {appointment.guardianName ? ` · ${appointment.guardianName}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {upcomingAppointments.length > 0 ? (
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <h3 className="text-sm font-medium text-[var(--muted)]">Coming up</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {upcomingAppointments.map((appointment) => (
                    <li key={appointment.id} className="flex justify-between gap-3">
                      <span>
                        {appointment.studentName} · {appointment.typeName}
                      </span>
                      <span className="text-[var(--muted)]">
                        {formatDay(appointment.startsAt, teacher.timezone)}{' '}
                        {formatTime(appointment.startsAt, teacher.timezone)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="card p-5">
            <h2 className="text-lg font-semibold">Contact queue</h2>
            {contactQueue.length === 0 ? (
              <EmptyState text="No open parent contacts. Nice work." />
            ) : (
              <ul className="mt-4 divide-y divide-[var(--line)]">
                {contactQueue.map((task) => (
                  <li key={task.id} className="py-3 first:pt-0 last:pb-0">
                    <Link href={`/contacts/${task.id}`} className="-mx-2 rounded-xl px-2 hover:bg-[var(--pine-soft)]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityClass[task.priority]}`}
                        >
                          {CONTACT_PRIORITY_LABELS[task.priority]}
                        </span>
                        {task.isOverdue ? (
                          <span className="text-xs font-medium text-red-700">Overdue</span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-medium">{task.guardianName}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {task.studentName} · {CONTACT_REASON_LABELS[task.reason]} ·{' '}
                        {CONTACT_STATUS_LABELS[task.status]}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-lg font-semibold">Recent communication</h2>
          {recentActivity.length === 0 ? (
            <EmptyState text="Contact history will show up here after the first call." />
          ) : (
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {recentActivity.map((item) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium">{item.studentName}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {formatDay(item.contactedAt, teacher.timezone)} · {item.outcome.replaceAll('_', ' ').toLowerCase()}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="card p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${emphasize ? 'text-[var(--danger)]' : 'text-[var(--ink)]'}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="mt-4 text-sm text-[var(--muted)]">{text}</p>;
}
