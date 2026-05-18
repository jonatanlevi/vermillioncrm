import { VermillionUserDetail } from "@/components/vermillion/user-detail";

export const dynamic = "force-dynamic";

export default async function VermillionUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VermillionUserDetail userId={id} />;
}
