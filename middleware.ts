import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ROLE_HOME, canAccessPath } from "@/lib/permissions";
import type { Role } from "@prisma/client";
import { getAuthSecret } from "@/lib/auth-secret";

const COOKIE = "examly_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guarded =
    pathname.startsWith("/super-admin") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student");

  if (!guarded) return NextResponse.next();

  const token = request.cookies.get(COOKIE)?.value;
  if (!token) {
    const login = pathname.startsWith("/student") ? "/auth/student-login" : "/auth/login";
    return NextResponse.redirect(new URL(login, request.url));
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const role = payload.role as Role;
    if (!canAccessPath(role, pathname)) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }
    return NextResponse.next();
  } catch {
    const login = pathname.startsWith("/student") ? "/auth/student-login" : "/auth/login";
    return NextResponse.redirect(new URL(login, request.url));
  }
}

export const config = {
  matcher: ["/super-admin/:path*", "/admin/:path*", "/teacher/:path*", "/student/:path*"],
};
