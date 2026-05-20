import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { hasRoutePermission, firstAllowedHref } from "@/lib/auth/permissions";

const PUBLIC_PREFIXES = ["/login", "/register", "/unauthorized"];
const PUBLIC_API = ["/api/auth", "/api/health", "/api/dev-log"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // אין Prisma ב-Edge Middleware — בדיקת setup רק בדפי שרת (/login, /register)

  if (pathname.startsWith("/ceo/approvals") && session?.user?.role !== "CEO") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    PUBLIC_API.some((p) => pathname.startsWith(p))
  ) {
    if ((pathname === "/login" || pathname === "/register") && session?.user?.role) {
      const role = session.user.role;
      const perms = session.user.permissions;
      if (pathname === "/register" && role === "CEO") {
        return NextResponse.next();
      }
      const dest = firstAllowedHref(role, perms);
      if (dest !== "/unauthorized") {
        return NextResponse.redirect(new URL(dest, req.url));
      }
    }
    return NextResponse.next();
  }

  if (!session?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = session.user.role;
  const permissions = session.user.permissions;

  if (pathname.startsWith("/ceo/employees") && role !== "CEO") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (pathname === "/") {
    if (role === "CEO") return NextResponse.next();
    return NextResponse.redirect(new URL(firstAllowedHref(role, permissions), req.url));
  }

  if (!hasRoutePermission(pathname, role, permissions)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
