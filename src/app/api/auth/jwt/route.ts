import { NextResponse } from "next/server";
import { z } from "zod";
import { SC_JWT_COOKIE_NAME } from "@/lib/appwrite/server";
const MAX_AGE_DAYS = 7;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

const bodySchema = z.object({ jwt: z.string().min(1, "JWT required") });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jwt } = bodySchema.parse(body);

    const res = NextResponse.json({ ok: true });
    const isProd = process.env.NODE_ENV === "production";
    res.cookies.set(SC_JWT_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
