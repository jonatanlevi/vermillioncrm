export const EMPLOYEE_ROLES: Record<string, string> = {
  CEO: "מנכ״ל",
  SALES: "מכירות",
  MARKETING: "שיווק",
  FINANCE: "כספים",
  SUPPORT: "תמיכה",
  OPS: "תפעול",
};

export const EMPLOYEE_STATUS: Record<string, string> = {
  ACTIVE: "פעיל",
  ON_LEAVE: "חופשה",
  INACTIVE: "לא פעיל",
};

export const ATTENDANCE_STATUS: Record<string, string> = {
  PRESENT: "נוכח",
  LATE: "איחור",
  REMOTE: "עבודה מהבית",
  ABSENT: "נעדר",
  SICK: "מחלה",
  VACATION: "חופשה",
  HALF_DAY: "חצי יום",
};

export const ACTION_LABELS: Record<string, string> = {
  AGENT_RUN: "פעולת AI במודול",
  SALE_CREATED: "עסקה חדשה",
  SALE_WON: "עסקה נסגרה",
  CAMPAIGN_CREATED: "קמפיין חדש",
  WHATSAPP_SENT: "הודעת וואטסאפ",
  LOGIN: "התחברות",
  ATTENDANCE_MARKED: "רישום נוכחות",
  EMPLOYEE_CREATED: "עובד חדש נוסף",
};

export function roleLabel(role: string) {
  return EMPLOYEE_ROLES[role] ?? role;
}

export function statusLabel(status: string) {
  return EMPLOYEE_STATUS[status] ?? status;
}

export function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export function attendanceLabel(status: string) {
  return ATTENDANCE_STATUS[status] ?? status;
}
