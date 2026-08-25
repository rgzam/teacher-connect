import Link from 'next/link';

export function AppHeader({
  teacherName,
  onLogout,
}: {
  teacherName: string;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            TeacherConnect
          </Link>
          <p data-testid="teacher-name" className="text-xs text-zinc-500">
            {teacherName}
          </p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-zinc-700 hover:text-zinc-950">
            Today
          </Link>
          <Link href="/students" className="text-zinc-700 hover:text-zinc-950">
            Students
          </Link>
          <Link href="/contacts" className="text-zinc-700 hover:text-zinc-950">
            Contacts
          </Link>
          <Link href="/schedule" className="text-zinc-700 hover:text-zinc-950">
            Schedule
          </Link>
          <Link href="/appointments" className="text-zinc-700 hover:text-zinc-950">
            Appointments
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-zinc-300 px-3 py-1.5"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
