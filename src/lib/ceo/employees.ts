import { getCeoDb } from "./db-access";
import { logEmployeeActivity } from "./activity";
import { ensureDemoTeam } from "./seed";

export type CreateEmployeeInput = {
  name: string;
  email: string;
  role: string;
  department?: string | null;
  phone?: string | null;
  status?: string;
  hiredAt?: string | null;
  managerId?: string | null;
};

export async function listEmployeesForSelect() {
  await ensureDemoTeam();
  return getCeoDb().employee.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}

export async function createEmployee(input: CreateEmployeeInput) {
  await ensureDemoTeam();
  const db = getCeoDb();

  const employee = await db.employee.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      department: input.department?.trim() || null,
      phone: input.phone?.trim() || null,
      status: input.status ?? "ACTIVE",
      hiredAt: input.hiredAt ? new Date(input.hiredAt) : null,
      managerId: input.managerId || null,
    },
  });

  await logEmployeeActivity({
    employeeId: employee.id,
    action: "EMPLOYEE_CREATED",
    entityType: "employee",
    entityId: employee.id,
    metadata: { name: employee.name, role: employee.role },
  });

  return employee;
}
