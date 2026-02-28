import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { SessionData } from "@/lib/auth/session-config";
import { sessionOptions } from "@/lib/auth/session-config";
import { apiError } from "@/lib/auth/require-auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "E-posta ve şifre gerekli", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        apiError("UNAUTHORIZED", "E-posta veya şifre hatalı"),
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        apiError("UNAUTHORIZED", "E-posta veya şifre hatalı"),
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    session.userId = user.id;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      ok: true,
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error("[auth/login]", e);
    const msg = e instanceof Error ? e.message : String(e);
    const isDbError =
      !process.env.DATABASE_URL ||
      /P1001|P1017|connect ECONNREFUSED|connect ETIMEDOUT|Environment variable not found/i.test(msg);
    if (isDbError) {
      return NextResponse.json(
        apiError(
          "SERVER_ERROR",
          process.env.DATABASE_URL
            ? "Veritabanına bağlanılamadı. DATABASE_URL ve migration'ı kontrol edin."
            : "Veritabanı yapılandırılmamış. .env.local veya Vercel Environment Variables ayarlayın, ardından npm run db:migrate ve npm run db:seed çalıştırın."
        ),
        { status: 503 }
      );
    }
    return NextResponse.json(
      apiError("SERVER_ERROR", "Giriş yapılamadı"),
      { status: 500 }
    );
  }
}
