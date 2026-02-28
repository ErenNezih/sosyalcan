import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SessionData } from "./session-config";
import { sessionOptions } from "./session-config";

export type ApiError = { ok: false; code: string; message: string; details?: unknown };
export type ApiSuccess<T> = { ok: true; data: T };

export function apiError(code: string, message: string, details?: unknown): ApiError {
  return { ok: false, code, message, details };
}

export async function requireAuth(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session?.userId || !session.isLoggedIn) {
    return {
      ok: false,
      response: NextResponse.json(
        apiError("UNAUTHORIZED", "Oturum gerekli"),
        { status: 401 }
      ),
    };
  }

  return { ok: true, userId: session.userId };
}

/** Route handler'larda request body ile kullanılmak için - cookies() async. */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session?.userId && session?.isLoggedIn ? session : null;
}
