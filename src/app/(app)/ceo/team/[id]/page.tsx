import { EmployeeDetail } from "@/components/ceo/employee-detail";

export const dynamic = "force-dynamic";

export default async function CeoEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeDetail id={id} />;
}
