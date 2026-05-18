"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  type PermissionKey,
} from "@/lib/auth/permissions";
import { EMPLOYEE_ROLES } from "@/lib/ceo/constants";
import { PasswordField } from "./password-field";

export type RegisterMode = "initial-ceo" | "add-employee" | "self-signup";

type Props = {
  mode: RegisterMode;
};

const emptyPerms = () =>
  Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<
    PermissionKey,
    boolean
  >;

export function RegisterForm({ mode }: Props) {
  const router = useRouter();
  const isCeoSetup = mode === "initial-ceo";
  const isSelfSignup = mode === "self-signup";

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [jobRole, setJobRole] = useState("SALES");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [perms, setPerms] = useState(emptyPerms);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordsMatch =
    password.length >= 8 &&
    passwordConfirm.length >= 8 &&
    password === passwordConfirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== passwordConfirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          passwordConfirm,
          accessRole: isCeoSetup ? "CEO" : "EMPLOYEE",
          mode: isSelfSignup ? "self-signup" : isCeoSetup ? undefined : "add-employee",
          jobRole,
          department: department || undefined,
          phone: phone || undefined,
          permissions: perms,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }

      if (isCeoSetup) {
        const sign = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });
        if (sign?.error) {
          setError("נוצר המשתמש אך ההתחברות נכשלה — נסה בדף התחברות");
          router.push("/login");
          return;
        }
        router.push("/");
        router.refresh();
        return;
      }

      if (isSelfSignup) {
        setSuccess(
          data.message ??
            "הבקשה נשלחה למנכ״ל. תוכל להתחבר רק אחרי אישור."
        );
        setName("");
        setUsername("");
        setPassword("");
        setPasswordConfirm("");
        setDepartment("");
        setPhone("");
        setPerms(emptyPerms());
        return;
      }

      router.push("/ceo/employees");
      router.refresh();
    } catch {
      setError("שגיאת רשת");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[var(--border)] bg-black/20 px-3 py-2 text-sm text-white";

  const title = isCeoSetup
    ? "הגדרת מנכ״ל — הרשמה ראשונה"
    : isSelfSignup
      ? "הרשמה לצוות VerMillion"
      : "הוספת עובד חדש (מאושר מיידית)";

  const subtitle = isCeoSetup
    ? "בחר שם משתמש וסיסמה לכניסה שלך ל-CRM (גישה מלאה)"
    : isSelfSignup
      ? "הבקשה תועבר למנכ״ל לאישור — לא תוכל להתחבר עד לאישור"
      : "עובד שמוסף כאן נכנס מיד למערכת (ללא המתנה)";

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6"
      dir="rtl"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-lg space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--accent)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
        </div>

        <label className="block text-xs text-[var(--muted)]">
          שם מלא *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-xs text-[var(--muted)]">
          שם משתמש *
          <input
            required
            type="text"
            dir="ltr"
            autoComplete="username"
            pattern="[a-zA-Z0-9._-]{3,32}"
            title="3–32 תווים: אותיות, מספרים, נקודה, מקף, קו תחתון"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="סיסמה *"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
          />
          <PasswordField
            label="אימות סיסמה *"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            autoComplete="new-password"
            matchWith={password}
          />
        </div>

        {!isCeoSetup && (
          <>
            <label className="block text-xs text-[var(--muted)]">
              תפקיד בעסק *
              <select
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                className={inputClass}
              >
                {Object.entries(EMPLOYEE_ROLES)
                  .filter(([k]) => k !== "CEO")
                  .map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>

            {isSelfSignup && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs text-[var(--muted)]">
                  מחלקה
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block text-xs text-[var(--muted)]">
                  טלפון
                  <input
                    type="tel"
                    dir="ltr"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <p className="text-xs font-medium text-[var(--muted)] sm:col-span-2">
                {isSelfSignup
                  ? "הרשאות מבוקשות (המנכ״ל יאשר/ישנה)"
                  : "הרשאות גישה ל-CRM"}
              </p>
              {PERMISSION_KEYS.map((key) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={perms[key]}
                    onChange={() => setPerms((p) => ({ ...p, [key]: !p[key] }))}
                    className="rounded border-[var(--border)]"
                  />
                  {PERMISSION_LABELS[key]}
                </label>
              ))}
            </div>
          </>
        )}

        {isCeoSetup && (
          <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-dim)]/10 px-4 py-3 text-sm">
            <p className="font-medium text-[var(--accent)]">תפקיד: מנכ״ל</p>
            <p className="mt-1 text-[var(--muted)]">
              גישה מלאה לכל המודולים ולניהול עובדים
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="rounded-lg border border-green-700/40 bg-green-950/30 p-3 text-sm text-green-300">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={
            loading ||
            Boolean(success && isSelfSignup) ||
            !passwordsMatch
          }
          className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading
            ? "שומר…"
            : isCeoSetup
              ? "צור חשבון מנכ״ל והתחבר"
              : isSelfSignup
                ? "שלח בקשה למנכ״ל"
                : "הוסף עובד (מיידי)"}
        </button>

        <p className="text-center text-xs text-[var(--muted)]">
          {isCeoSetup && (
            <>
              כבר יש לך חשבון?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                התחברות
              </Link>
            </>
          )}
          {isSelfSignup && (
            <>
              כבר אושרת?{" "}
              <Link href="/login" className="text-[var(--accent)] hover:underline">
                התחברות
              </Link>
            </>
          )}
          {mode === "add-employee" && (
            <Link href="/ceo/employees" className="text-[var(--accent)] hover:underline">
              ← חזרה לניהול עובדים
            </Link>
          )}
        </p>
      </form>
    </div>
  );
}
