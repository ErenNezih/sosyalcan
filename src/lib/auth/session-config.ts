import type { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "fallback-min-32-chars-required-for-iron",
  cookieName: "sosyalcan_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
  ttl: 60 * 60 * 24 * 7, // 7 days
};
