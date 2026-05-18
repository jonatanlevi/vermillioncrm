import { needsInitialSetup } from "@/lib/auth/setup";
import { LoginClient } from "./login-client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const setup = await needsInitialSetup();
  return (
    <LoginClient
      showRegisterLink={setup}
      showEmployeeSignupLink={!setup}
    />
  );
}
