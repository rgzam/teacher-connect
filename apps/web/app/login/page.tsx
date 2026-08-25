import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="page">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-16">
        <div className="card p-5 sm:p-8">
          <p className="eyebrow">Teacher sign in</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-[var(--muted)]">
            Only teachers log in. Parents book with a public link — no account.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
