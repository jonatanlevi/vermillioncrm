"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PasswordField } from "@/components/auth/password-field";

function LoginForm({
  showRegisterLink,
  showEmployeeSignupLink,
}: {
  showRegisterLink?: boolean;
  showEmployeeSignupLink?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("שם משתמש או סיסמה שגויים");
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
          שם משתמש
          <input
            required
            type="text"
            dir="ltr"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </label>
        <PasswordField
          label="סיסמה"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          minLength={1}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "מתחבר…" : "התחברות"}
        </button>
        {(showRegisterLink || showEmployeeSignupLink) && (
          <div className="space-y-1 text-center text-xs text-[var(--muted)]">
            {showRegisterLink && (
              <p>
                פעם ראשונה?{" "}
                <Link href="/register" className="text-[var(--accent)] hover:underline">
                  הרשמת מנכ״ל
                </Link>
              </p>
            )}
            {showEmployeeSignupLink && (
              <p>
                עובד חדש?{" "}
                <Link href="/register" className="text-[var(--accent)] hover:underline">
                  הרשמה (ממתין לאישור מנכ״ל)
                </Link>
              </p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export function LoginClient({
  showRegisterLink,
  showEmployeeSignupLink,
}: {
  showRegisterLink?: boolean;
  showEmployeeSignupLink?: boolean;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-[var(--muted)]">
          טוען…
        </div>
      }
    >
      <LoginForm
        showRegisterLink={showRegisterLink}
        showEmployeeSignupLink={showEmployeeSignupLink}
      />
    </Suspense>
  );
}
