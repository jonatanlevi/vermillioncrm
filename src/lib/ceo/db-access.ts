import { db } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

export class PrismaEmployeeModelsMissingError extends Error {
  constructor() {
    super(
      "מודול עובדים לא זמין — עצור את npm run dev, הרץ: npx prisma generate && npm run dev"
    );
    this.name = "PrismaEmployeeModelsMissingError";
  }
}

type CeoDb = Pick<
  PrismaClient,
  | "employee"
  | "employeeActivity"
  | "employeeGoal"
  | "employeeAttendance"
  | "sale"
  | "campaign"
  | "whatsappMessage"
  | "agentRun"
>;

export function isCeoDbReady(): boolean {
  const client = db as PrismaClient;
  return Boolean(client.employee && client.employeeAttendance);
}

export function getCeoDb(): CeoDb {
  const client = db as PrismaClient;
  if (!client.employee || !client.employeeAttendance) {
    throw new PrismaEmployeeModelsMissingError();
  }
  return client;
}
