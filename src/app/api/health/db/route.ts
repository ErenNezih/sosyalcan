import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * DB sağlık kontrolü — kurulumun tamamlanıp tamamlanmadığını doğrular.
 * DATABASE_URL yoksa açık hata döner.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        code: "DB_NOT_CONFIGURED",
        message: "DATABASE_URL ortam değişkeni tanımlı değil. .env.local veya Vercel Environment Variables ayarlayın.",
      },
      { status: 503 }
    );
  }

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      data: { userCount, status: "connected" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        code: "DB_CONNECTION_FAILED",
        message: "Veritabanına bağlanılamadı.",
        details: msg,
      },
      { status: 503 }
    );
  }
}
