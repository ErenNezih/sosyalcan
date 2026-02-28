import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const plan = await prisma.paymentPlan.update({
      where: { id },
      data: { archivedAt: null },
    });

    return NextResponse.json({ ok: true, data: plan });
  } catch (e) {
    console.error("[api/payments/plans restore]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Plan geri yüklenemedi"), { status: 500 });
  }
}
