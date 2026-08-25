'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listStudents } from '@/lib/api';
import { useTeacherSession } from '@/lib/use-teacher-session';
import { AppHeader } from '@/components/app-header';
import type { StudentSummary } from '@teacher-connect/types';

export default function StudentsPage() {
  const { teacherName, loading, onLogout } = useTeacherSession();
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    void listStudents()
      .then(setStudents)
      .catch(() => setError('Could not load students.'));
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
            <h1 className="text-2xl font-semibold">Students</h1>
            <p className="text-sm text-[var(--muted)]">Fictional demo names only.</p>
          </div>
          <Link
            href="/students/new"
            className="btn"
          >
            Add student
          </Link>
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {students.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No students yet.</p>
        ) : (
          <ul className="card divide-y divide-[var(--line)]">
            {students.map((student) => (
              <li key={student.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {student.guardians[0]
                      ? `${student.guardians[0].firstName} ${student.guardians[0].lastName}`
                      : 'No guardian yet'}
                    {student.openTaskCount > 0
                      ? ` · ${student.openTaskCount} open contact${student.openTaskCount === 1 ? '' : 's'}`
                      : ''}
                  </p>
                </div>
                <Link
                  href={`/contacts/new?studentId=${student.id}`}
                  className="text-sm font-medium text-[var(--pine)] underline"
                >
                  Add contact
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
