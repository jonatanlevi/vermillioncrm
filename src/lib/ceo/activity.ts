import { getCeoDb } from "./db-access";

export async function logEmployeeActivity(params: {
  employeeId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  return getCeoDb().employeeActivity.create({
    data: {
      employeeId: params.employeeId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: JSON.stringify(params.metadata ?? {}),
    },
  });
}
