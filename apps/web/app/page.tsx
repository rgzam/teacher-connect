import Link from 'next/link';
import { getApiHealth } from '@/lib/api';

export default async function Home() {
  const health = await getApiHealth();
  const apiReady = health?.status === 'ok';

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          TeacherConnect
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Parent communication, without the sticky notes
        </h1>
        <p className="mt-3 max-w-xl text-lg leading-7 text-zinc-600">
          Teachers manage follow-ups and appointments. Parents book a time with a
          simple link.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white"
          >
            Teacher sign in
          </Link>
          <Link
            href="/book/ly-le"
            className="inline-flex rounded-lg border border-zinc-300 px-4 py-2.5 font-medium"
          >
            Book with Ly Le
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">System status</h2>
        <dl className="mt-4 grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">Next.js frontend</dt>
            <dd className="font-medium text-emerald-700">Running</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500">NestJS API + PostgreSQL</dt>
            <dd className={apiReady ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>
              {apiReady ? 'Connected' : 'Not reachable yet'}
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
