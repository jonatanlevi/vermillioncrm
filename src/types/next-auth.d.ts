import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: string;
    permissions: string;
  }

  interface Session {
    user: DefaultSession["user"] & {
      role: string;
      permissions: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    permissions?: string;
  }
}
