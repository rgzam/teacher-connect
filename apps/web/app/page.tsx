import Link from 'next/link';

export default function Home() {
  return (
    <main className="page">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
        <div>
          <p className="eyebrow">TeacherConnect</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            Parent calls and meetings, in one calm place
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-7 text-[var(--muted)]">
            Ly sees who to contact and when she is free. Parents pick a time
            without an account.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="btn">
              Teacher sign in
            </Link>
            <Link href="/book/ly-le" className="btn-secondary">
              Book with Ly Le
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
