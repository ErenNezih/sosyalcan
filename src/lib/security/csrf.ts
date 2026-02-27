import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";

const CSRF_HEADER = "X-CSRF-Token";
const CSRF_COOKIE = "csrf_token";

/**
 * Generates a random CSRF token and sets it as a cookie.
 * Returns the token so it can be passed to the client (e.g. via a header or in the page).
 */
export async function generateCSRFToken() {
  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_COOKIE, token, {
    path: "/",
    httpOnly: false, // Client needs to read this to send it in the header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return token;
}

/**
 * Validates the CSRF token in the request.
 * Checks if the X-CSRF-Token header matches the csrf_token cookie.
 * Also checks Origin/Referer.
 */
export async function validateCSRF(request: Request) {
  // 1. Check Origin/Referer
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const appOrigin = process.env.APP_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (origin && origin !== appOrigin) {
    return false;
  }
  
  if (referer && !referer.startsWith(appOrigin)) {
    return false;
  }

  // 2. Check CSRF Token
  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return false;
  }

  return true;
}
