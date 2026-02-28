import { NextResponse } from "next/server";
import { requireAuth, apiError } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return NextResponse.json(
      apiError("NOT_FOUND", "Kullanıcı bulunamadı"),
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: user });
}
