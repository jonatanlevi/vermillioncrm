export const PERMISSION_KEYS = [
  "vermillion",
  "ceo",
  "campaigns",
  "finance",
  "sales",
  "whatsapp",
  "media",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type PermissionMap = Partial<Record<PermissionKey, boolean>>;

export const ROUTE_PERMISSIONS: Record<string, PermissionKey> = {
  "/vermillion": "vermillion",
  "/ceo": "ceo",
  "/campaigns": "campaigns",
  "/finance": "finance",
  "/sales": "sales",
  "/whatsapp": "whatsapp",
  "/media": "media",
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  vermillion: "מרכז מוצר (/vermillion)",
  ceo: "מנכ״ל (/ceo)",
  campaigns: "קמפיינים (/campaigns)",
  finance: "כספים (/finance)",
  sales: "מכירות (/sales)",
  whatsapp: "WhatsApp (/whatsapp)",
  media: "מדיה (/media)",
};

export function emptyPermissions(): Record<PermissionKey, boolean> {
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false])) as Record<
    PermissionKey,
    boolean
  >;
}

export function allPermissionsTrue(): Record<PermissionKey, boolean> {
  return Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])) as Record<
    PermissionKey,
    boolean
  >;
}

export function parsePermissions(raw: string | unknown): Record<PermissionKey, boolean> {
  const base = emptyPermissions();
  if (raw === "all") return allPermissionsTrue();

  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      return base;
    }
  }

  if (!parsed || typeof parsed !== "object") return base;

  for (const key of PERMISSION_KEYS) {
    if (key in parsed && typeof (parsed as Record<string, unknown>)[key] === "boolean") {
      base[key] = (parsed as Record<string, boolean>)[key];
    }
  }
  return base;
}

export function permissionsToJson(map: PermissionMap): string {
  const out = emptyPermissions();
  for (const key of PERMISSION_KEYS) {
    if (map[key]) out[key] = true;
  }
  return JSON.stringify(out);
}

const API_ROUTE_PERMISSIONS: [string, PermissionKey][] = [
  ["/api/app", "vermillion"],
  ["/api/campaigns", "campaigns"],
  ["/api/agents", "campaigns"],
  ["/api/pipeline", "sales"],
  ["/api/jobs", "sales"],
];

export function hasRoutePermission(
  pathname: string,
  role: string | undefined,
  permissionsRaw: string | undefined
): boolean {
  if (role === "CEO") return true;

  const perms = parsePermissions(permissionsRaw ?? "{}");

  for (const [prefix, key] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return perms[key];
    }
  }

  for (const [prefix, key] of API_ROUTE_PERMISSIONS) {
    if (pathname.startsWith(prefix)) {
      return perms[key];
    }
  }

  if (pathname.startsWith("/api/ceo")) {
    return perms.ceo;
  }

  if (pathname.startsWith("/api/")) {
    return true;
  }

  return false;
}

export function firstAllowedHref(
  role: string | undefined,
  permissionsRaw: string | undefined
): string {
  if (role === "CEO") return "/";
  const perms = parsePermissions(permissionsRaw ?? "{}");
  if (perms.ceo) return "/ceo";
  for (const key of PERMISSION_KEYS) {
    if (perms[key]) {
      const entry = Object.entries(ROUTE_PERMISSIONS).find(([, v]) => v === key);
      if (entry) return entry[0];
    }
  }
  return "/unauthorized";
}
