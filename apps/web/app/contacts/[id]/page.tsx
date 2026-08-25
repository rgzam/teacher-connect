'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getContactTask, recordContact } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import {
  CONTACT_METHOD_LABELS,
  CONTACT_METHODS,
  CONTACT_OUTCOME_LABELS,
  CONTACT_OUTCOMES,
  CONTACT_PRIORITY_LABELS,
  CONTACT_REASON_LABELS,
  CONTACT_STATUS_LABELS,
  formatDay,
} from '@/lib/labels';
import type { ContactTaskDetail } from '@teacher-connect/types';

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const { teacherName, user, loading, onLogout } = useTeacherSession();
  const [task, setTask] = useState<ContactTaskDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const timeZone = 'America/Denver';

  useEffect(() => {
    if (loading || !params.id) {
      return;
    }

    void getContactTask(params.id)
      .then(setTask)
      .catch(() => setError('Could not load this contact.'));
  }, [loading, params.id]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!task) {
      return;
    }

    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      const updated = await recordContact(task.id, {
        method: String(form.get('method') ?? 'PHONE') as never,
        outcome: String(form.get('outcome') ?? 'OTHER') as never,
        notes: String(form.get('notes') ?? '') || undefined,
        followUpDate: String(form.get('followUpDate') ?? '') || undefined,
        complete: form.get('complete') === 'on',
      });
      setTask(updated);
      event.currentTarget.reset();
    } catch {
      setError('Could not save this contact attempt.');
    } finally {
      setPending(false);
    }
  }

  if (loading || !task) {
    return <p className="p-8 text-zinc-500">{error ?? 'Loading…'}</p>;
  }

  const completed = task.status === 'COMPLETED';

  return (
    <main className="min-h-full bg-zinc-50">
      <AppHeader teacherName={teacherName} onLogout={() => void onLogout()} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <div>
          <p className="text-sm text-zinc-500">
            {CONTACT_PRIORITY_LABELS[task.priority]} · {CONTACT_STATUS_LABELS[task.status]}
          </p>
          <h1 className="mt-1 text-2xl font-semibold">
            {task.guardian
              ? `${task.guardian.firstName} ${task.guardian.lastName}`
              : 'Parent contact'}
          </h1>
          <p className="text-zinc-600">
            {task.student.firstName} {task.student.lastName} · {CONTACT_REASON_LABELS[task.reason]}
          </p>
          {task.notes ? <p className="mt-2 text-sm text-zinc-600">{task.notes}</p> : null}
        </div>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-semibold">History</h2>
          {task.logs.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No attempts yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-zinc-100">
              {task.logs.map((log) => (
                <li key={log.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium">
                    {CONTACT_METHOD_LABELS[log.method]} · {CONTACT_OUTCOME_LABELS[log.outcome]}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {formatDay(log.contactedAt, user?.teacher ? timeZone : timeZone)}
                    {log.notes ? ` · ${log.notes}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {completed ? (
          <p className="text-sm text-zinc-600">This contact is complete. History stays on the record.</p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
            <h2 className="font-semibold">Record an attempt</h2>
            <select name="method" required defaultValue="PHONE" className="input">
              {CONTACT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {CONTACT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
            <select name="outcome" required defaultValue="LEFT_VOICEMAIL" className="input">
              {CONTACT_OUTCOMES.map((outcome) => (
                <option key={outcome} value={outcome}>
                  {CONTACT_OUTCOME_LABELS[outcome]}
                </option>
              ))}
            </select>
            <textarea name="notes" placeholder="What happened?" className="input min-h-24" />
            <label className="grid gap-1 text-sm">
              Follow-up date (optional)
              <input name="followUpDate" type="date" className="input" />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input name="complete" type="checkbox" />
              Mark complete
            </label>
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
            >
              {pending ? 'Saving…' : 'Save attempt'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
