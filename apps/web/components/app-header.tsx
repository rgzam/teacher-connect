import Link from 'next/link';

const links = [
  { href: '/dashboard', label: 'Today' },
  { href: '/students', label: 'Students' },
  { href: '/contacts', label: 'Contacts' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/appointments', label: 'Appointments' },
];

export function AppHeader({
  teacherName,
  onLogout,
}: {
  teacherName: string;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-[var(--line)] bg-[var(--card)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-h-11 items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--pine)] text-sm font-bold text-white">
              T
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">TeacherConnect</span>
              <span data-testid="teacher-name" className="block text-xs text-[var(--muted)]">
                {teacherName}
              </span>
            </span>
          </Link>
          <button type="button" onClick={onLogout} className="btn-secondary w-auto px-3 py-1.5 text-sm">
            Log out
          </button>
        </div>
        <nav className="nav-scroll text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 shrink-0 items-center rounded-full px-3 text-[var(--ink)] hover:bg-[var(--pine-soft)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
