'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listContactTasks } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import {
  CONTACT_PRIORITY_LABELS,
  CONTACT_REASON_LABELS,
  CONTACT_STATUS_LABELS,
} from '@/lib/labels';
import type { ContactTaskSummary } from '@teacher-connect/types';

export default function ContactsPage() {
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [tasks, setTasks] = useState<ContactTaskSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    void listContactTasks()
      .then(setTasks)
      .catch(() => setError('Could not load contacts.'));
  }, [loading]);

  if (loading) {
    return <p className="page p-8 text-[var(--muted)]">Loading…</p>;
  }

  return (
    <main className="page">
      <AppHeader teacherName={teacherName} onLogout={() => void onLogout()} />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Contact queue</h1>
            <p className="text-sm text-[var(--muted)]">Open follow-ups, sorted by due date.</p>
          </div>
          <Link
            href="/contacts/new"
            className="btn"
          >
            New contact
          </Link>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {tasks.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No open contacts.</p>
        ) : (
          <ul className="card divide-y divide-[var(--line)]">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link href={`/contacts/${task.id}`} className="block px-5 py-4 hover:bg-[var(--pine-soft)]">
                  <p className="font-medium">
                    {task.guardian
                      ? `${task.guardian.firstName} ${task.guardian.lastName}`
                      : `${task.student.firstName}'s parent`}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {task.student.firstName} {task.student.lastName} ·{' '}
                    {CONTACT_REASON_LABELS[task.reason]} · {CONTACT_PRIORITY_LABELS[task.priority]} ·{' '}
                    {CONTACT_STATUS_LABELS[task.status]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
