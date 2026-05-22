"use client";

import { useId, useState } from "react";

type Props = {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
  /** כשמוגדר — מציג האם תואם לשדה הסיסמה הראשי */
  matchWith?: string;
  id?: string;
};

export function PasswordField({
  label,
  value = "",
  onChange,
  name,
  autoComplete = "new-password",
  minLength = 8,
  required = true,
  matchWith,
  id: idProp,
}: Props) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);

  const showMatch =
    matchWith !== undefined && (value.length > 0 || matchWith.length > 0);
  const passwordsMatch = matchWith !== undefined && value === matchWith;
  const passwordsMismatch =
    showMatch && value.length > 0 && matchWith.length > 0 && !passwordsMatch;

  const borderClass = passwordsMismatch
    ? "border-red-500/70 focus:border-red-400"
    : showMatch && passwordsMatch && value.length > 0
      ? "border-green-600/70 focus:border-green-500"
      : "border-[var(--border)]";

  return (
    <div className="block text-xs text-[var(--muted)]">
      <span className="mb-1 block">{label}</span>
      <div className="relative">
        <input
          id={id}
          name={name}
          required={required}
          type={visible ? "text" : "password"}
          minLength={minLength}
          autoComplete={autoComplete}
          {...(onChange
            ? { value, onChange: (e) => onChange(e.target.value) }
            : { defaultValue: "" })}
          dir="ltr"
          className={`mt-0 w-full rounded-lg border bg-black/20 py-2 pl-10 pr-3 text-sm text-white outline-none focus:ring-1 focus:ring-[var(--accent)]/40 ${borderClass}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] hover:text-white"
          aria-label={visible ? "הסתר סיסמה" : "הצג סיסמה"}
          title={visible ? "הסתר סיסמה" : "הצג סיסמה"}
        >
          {visible ? (
            <EyeOffIcon />
          ) : (
            <EyeIcon />
          )}
        </button>
      </div>
      {showMatch && (
        <p
          className={`mt-1 text-xs ${
            passwordsMatch ? "text-green-400" : passwordsMismatch ? "text-red-400" : "text-[var(--muted)]"
          }`}
          role="status"
        >
          {value.length === 0 || matchWith.length === 0
            ? "הקלד אימות סיסמה"
            : passwordsMatch
              ? "✓ הסיסמאות תואמות"
              : "הסיסמאות אינן תואמות"}
        </p>
      )}
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42M9.88 5.09A10.94 10.94 0 0 1 12 5c7 0 11 7 11 7a18.45 18.45 0 0 1-2.16 2.92M6.06 6.06A10.94 10.94 0 0 0 1 12s4 7 11 7a10.94 10.94 0 0 0 5.91-1.76"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
