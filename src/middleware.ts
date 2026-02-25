import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Appwrite session cookie: a_session_<PROJECT_ID>. Proje ID küçük harf (Appwrite tutarlı). */
function getSessionCookieName(): string {
  const id = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  return `a_session_${id}`.toLowerCase();
}

/** Debug: ?debug=auth ile istek atıldığında yanıt header'larına session bilgisi eklenir (F12 → Network). */
const DEBUG_AUTH_PARAM = "debug";
const DEBUG_AUTH_VALUE = "auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieName = getSessionCookieName();
  const hasSession = request.cookies.has(cookieName);

  // Debug: Vercel/yerel log için (Vercel'de Runtime Logs'ta görünür)
  // console.log("[auth]", { pathname, cookieName, hasSession, envProjectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ? "set" : "missing" });

  const isDebugAuth =
    request.nextUrl.searchParams.get(DEBUG_AUTH_PARAM) === DEBUG_AUTH_VALUE;

  const addDebugHeaders = (res: NextResponse) => {
    if (!isDebugAuth) return res;
    res.headers.set("X-Debug-Auth-Cookie-Name", cookieName);
    res.headers.set("X-Debug-Auth-Session-Found", hasSession ? "1" : "0");
    res.headers.set("X-Debug-Auth-Project-Id", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "missing");
    return res;
  };

  // Vitrin ve login herkese açık
  if (pathname === "/" || pathname === "/login") {
    if (pathname === "/login" && hasSession) {
      return addDebugHeaders(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
    return addDebugHeaders(NextResponse.next());
  }

  // /dashboard ve altı: oturum zorunlu — yoksa login'e yönlendir (Demo Gör akışı)
  if (pathname.startsWith("/dashboard")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return addDebugHeaders(NextResponse.redirect(loginUrl));
    }
    return addDebugHeaders(NextResponse.next());
  }

  return addDebugHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/", "/dashboard", "/dashboard/:path*", "/login"],
};
