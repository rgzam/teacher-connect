import { getApiHealth } from '@/lib/api';

export default async function Home() {
  const health = await getApiHealth();
  const apiReady = health?.status === 'ok';

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          Phase 2 — Application Foundation
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">TeacherConnect</h1>
        <p className="mt-3 max-w-xl text-lg leading-7 text-zinc-600">
          A parent communication and scheduling platform. This first screen proves
          the frontend, backend, and database can talk to each other.
        </p>
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
        {health ? (
          <p className="mt-4 text-xs text-zinc-500">
            Last health check: {new Date(health.timestamp).toLocaleString()}
          </p>
        ) : (
          <p className="mt-4 text-sm text-zinc-600">
            Start the API with <code className="rounded bg-zinc-100 px-1.5 py-0.5">pnpm dev</code> after{' '}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5">pnpm db:up</code>.
          </p>
        )}
      </section>

      <section className="text-sm leading-6 text-zinc-600">
        <p>Next learning steps:</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Teacher login (Auth.js / JWT)</li>
          <li>Teacher dashboard</li>
          <li>Contact queue and history</li>
          <li>Public parent booking</li>
        </ol>
      </section>
    </main>
  );
}
