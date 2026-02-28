import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    await prisma.transaction.update({
      where: { id },
      data: { archivedAt: null },
    });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "İşlem bulunamadı"), { status: 404 });
    }
    console.error("[api/transactions restore]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Geri yüklenemedi"), { status: 500 });
  }
}
