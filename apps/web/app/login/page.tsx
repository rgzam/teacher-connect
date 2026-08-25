import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        Teacher sign in
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-3 text-zinc-600">
        Only teachers log in. Parents will book later with a public link — no account.
      </p>
      <LoginForm />
    </main>
  );
}
