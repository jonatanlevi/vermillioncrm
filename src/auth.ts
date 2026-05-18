import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { permissionsToJson } from "@/lib/auth/permissions";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const adminEmail = process.env.CRM_ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.CRM_ADMIN_PASSWORD ?? "";

        if (adminEmail && email === adminEmail && password === adminPassword) {
          return {
            id: "ceo",
            name: "מנכ״ל",
            email: adminEmail,
            role: "CEO",
            permissions: "all",
          };
        }

        const employee = await db.employee.findUnique({ where: { email } });
        if (!employee?.isActive || !employee.passwordHash) return null;
        if (employee.accessRole === "CEO") return null;

        const valid = await bcrypt.compare(password, employee.passwordHash);
        if (!valid) return null;

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "EMPLOYEE";
        session.user.permissions = (token.permissions as string) ?? "{}";
      }
      return session;
    },
  },
});

export { permissionsToJson };
