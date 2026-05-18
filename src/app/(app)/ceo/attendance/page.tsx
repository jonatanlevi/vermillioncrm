import { AttendanceJournal } from "@/components/ceo/attendance-journal";

export const dynamic = "force-dynamic";

export default async function CeoAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; edit?: string }>;
}) {
  const { date, edit } = await searchParams;
  return <AttendanceJournal workDate={date} editEmployeeId={edit} />;
}
