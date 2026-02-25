import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Edge-uyumlu: sadece cookie varlığı. Appwrite session cookie adı. */
function getSessionCookieName(): string {
  const id = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  return `a_session_${id}`.toLowerCase();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = getSessionCookieName();
  const hasSession = request.cookies.has(cookieName);

  // Vitrin ve login herkese açık
  if (pathname === "/" || pathname === "/login") {
    if (pathname === "/login" && hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // /dashboard ve altı: oturum zorunlu — yoksa login'e yönlendir (Demo Gör akışı)
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
