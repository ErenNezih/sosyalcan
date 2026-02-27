import { NextResponse } from "next/server";
import { SC_JWT_COOKIE_NAME } from "@/lib/appwrite/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SC_JWT_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
