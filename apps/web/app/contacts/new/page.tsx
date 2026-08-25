'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContactTask, listStudents } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import {
  CONTACT_PRIORITIES,
  CONTACT_PRIORITY_LABELS,
  CONTACT_REASON_LABELS,
  CONTACT_REASONS,
} from '@/lib/labels';
import type { StudentSummary } from '@teacher-connect/types';

export default function NewContactPage() {
  return (
    <Suspense fallback={<p className="p-8 text-zinc-500">Loading…</p>}>
      <NewContactForm />
    </Suspense>
  );
}

function NewContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetStudentId = searchParams.get('studentId') ?? '';
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    void listStudents().then(setStudents).catch(() => setError('Could not load students.'));
  }, [loading]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const studentId = String(form.get('studentId') ?? '');
    const student = students.find((item) => item.id === studentId);
    setPending(true);
    setError(null);

    try {
      const task = await createContactTask({
        studentId,
        guardianId: student?.guardians[0]?.id,
        reason: String(form.get('reason') ?? 'OTHER') as never,
        priority: String(form.get('priority') ?? 'NORMAL') as never,
        dueDate: String(form.get('dueDate') ?? ''),
        notes: String(form.get('notes') ?? '') || undefined,
      });
      router.push(`/contacts/${task.id}`);
    } catch {
      setError('Could not create the contact task.');
    } finally {
      setPending(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-zinc-500">Loading…</p>;
  }

  return (
    <main className="min-h-full bg-zinc-50">
      <AppHeader teacherName={teacherName} onLogout={() => void onLogout()} />
      <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-8">
        <h1 className="text-2xl font-semibold">New contact</h1>
        <label className="grid gap-1 text-sm">
          Student
          <select name="studentId" required defaultValue={presetStudentId} className="input">
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Reason
          <select name="reason" required defaultValue="ACADEMIC_CONCERN" className="input">
            {CONTACT_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {CONTACT_REASON_LABELS[reason]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Priority
          <select name="priority" required defaultValue="NORMAL" className="input">
            {CONTACT_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {CONTACT_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Due date
          <input name="dueDate" type="date" required className="input" />
        </label>
        <textarea name="notes" placeholder="Why this contact matters" className="input min-h-24" />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Create contact'}
        </button>
      </form>
    </main>
  );
}
