import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const IRON_SESSION_COOKIE = "sosyalcan_session";

/** Geçerli oturum: iron-session cookie. */
function hasValidSession(request: NextRequest): boolean {
  if (!request.cookies.has(IRON_SESSION_COOKIE)) return false;
  const val = request.cookies.get(IRON_SESSION_COOKIE)?.value;
  return !!(val && val.length > 0);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasValidSession(request);

  if (pathname === "/" || pathname === "/login") {
    if (pathname === "/login" && hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/login"],
};
