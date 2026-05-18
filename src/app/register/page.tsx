import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegisterForm } from "@/components/auth/register-form";
import { needsInitialSetup } from "@/lib/auth/setup";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await auth();
  const setup = await needsInitialSetup();
  const params = await searchParams;

  if (setup) {
    return <RegisterForm mode="initial-ceo" />;
  }

  if (!session) {
    return <RegisterForm mode="self-signup" />;
  }

  if (session.user?.role === "CEO" && params.mode === "employee") {
    return <RegisterForm mode="add-employee" />;
  }

  if (session.user?.role === "CEO") {
    redirect("/ceo/approvals");
  }

  redirect("/login");
}
