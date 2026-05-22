"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!username || !password) {
    return { error: "מלא שם משתמש וסיסמה" };
  }

  try {
    await signIn("credentials", {
      username,
      password,
      redirectTo: "/",
    });
  } catch (err) {
    const digest = typeof err === "object" && err && "digest" in err ? String((err as { digest?: string }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT")) throw err;

    if (err instanceof AuthError && err.type === "CredentialsSignin") {
      return { error: "שם משתמש או סיסמה שגויים" };
    }
    throw err;
  }

  return {};
}
