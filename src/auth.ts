import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { permissionsToJson } from "@/lib/auth/permissions";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = normalizeUsername(String(credentials?.username ?? ""));
        const password = String(credentials?.password ?? "");
        if (!username || !password) return null;

        const adminUser =
          process.env.CRM_ADMIN_USERNAME?.trim() ||
          process.env.CRM_ADMIN_EMAIL?.trim();
        const adminPassword = process.env.CRM_ADMIN_PASSWORD ?? "";

        if (
          adminUser &&
          username === normalizeUsername(adminUser) &&
          password === adminPassword
        ) {
          return {
            id: "ceo",
            name: "מנכ״ל",
            email: adminUser,
            role: "CEO",
            permissions: "all",
          };
        }

        const employee = await db.employee.findUnique({ where: { username } });
        if (
          !employee?.isActive ||
          !employee.passwordHash ||
          employee.approvalStatus !== "APPROVED"
        ) {
          return null;
        }

        const valid = await bcrypt.compare(password, employee.passwordHash);
        if (!valid) return null;

        if (employee.accessRole === "CEO") {
          return {
            id: employee.id,
            name: employee.name,
            email: employee.username ?? employee.email,
            role: "CEO",
            permissions: "all",
          };
        }

        return {
          id: employee.id,
          name: employee.name,
          email: employee.username ?? employee.email,
          role: "EMPLOYEE",
          permissions: employee.permissions,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "EMPLOYEE";
        session.user.permissions = (token.permissions as string) ?? "{}";
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
});

export { permissionsToJson };
