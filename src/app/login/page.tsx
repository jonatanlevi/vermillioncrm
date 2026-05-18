"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("אימייל או סיסמה שגויים");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6"
      dir="rtl"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--accent)]">VerMillion CRM</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">התחברות לצוות הפנימי</p>
        </div>
        <label className="block text-xs text-[var(--muted)]">
          אימייל
          <input
            required
            type="email"
            dir="ltr"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-[var(--muted)]">
          סיסמה
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "מתחבר…" : "התחברות"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          טוען…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
