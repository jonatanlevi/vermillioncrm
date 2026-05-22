"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { loginAction, type LoginState } from "./actions";

function LoginForm({
  showRegisterLink,
  showEmployeeSignupLink,
}: {
  showRegisterLink?: boolean;
  showEmployeeSignupLink?: boolean;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6"
      dir="rtl"
    >
      <form
        action={formAction}
        className="w-full max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--accent)]">VerMillion CRM</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">התחברות לצוות הפנימי</p>
        </div>
        <label className="block text-xs text-[var(--muted)]">
          שם משתמש או אימייל
          <input
            name="username"
            type="text"
            dir="ltr"
            autoComplete="username"
            required
            className={inputClass}
          />
        </label>
        <PasswordField
          label="סיסמה"
          name="password"
          autoComplete="current-password"
          minLength={1}
        />
        {state.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "מתחבר…" : "התחברות"}
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
