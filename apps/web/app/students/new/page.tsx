'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createStudent } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';

export default function NewStudentPage() {
  const router = useRouter();
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    try {
      await createStudent({
        firstName: String(form.get('firstName') ?? ''),
        lastName: String(form.get('lastName') ?? ''),
        notes: String(form.get('notes') ?? '') || undefined,
        guardian: {
          firstName: String(form.get('guardianFirstName') ?? ''),
          lastName: String(form.get('guardianLastName') ?? ''),
          email: String(form.get('guardianEmail') ?? '') || undefined,
          phone: String(form.get('guardianPhone') ?? '') || undefined,
        },
      });
      router.push('/students');
    } catch {
      setError('Could not save the student. Use fictional names only.');
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
      <form onSubmit={onSubmit} className="mx-auto flex max-w-xl flex-col gap-5 px-6 py-8">
        <h1 className="text-2xl font-semibold">Add student</h1>
        <p className="text-sm text-zinc-600">
          Use fictional names for the public demo. Never enter a real student.
        </p>
        <fieldset className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
          <legend className="px-1 text-sm font-medium">Student</legend>
          <input name="firstName" required placeholder="First name" className="input" />
          <input name="lastName" required placeholder="Last name" className="input" />
          <textarea name="notes" placeholder="Optional notes" className="input min-h-20" />
        </fieldset>
        <fieldset className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5">
          <legend className="px-1 text-sm font-medium">Guardian</legend>
          <input name="guardianFirstName" required placeholder="First name" className="input" />
          <input name="guardianLastName" required placeholder="Last name" className="input" />
          <input name="guardianEmail" type="email" placeholder="Email (optional)" className="input" />
          <input name="guardianPhone" placeholder="Phone (optional)" className="input" />
        </fieldset>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save student'}
        </button>
      </form>
    </main>
  );
}
