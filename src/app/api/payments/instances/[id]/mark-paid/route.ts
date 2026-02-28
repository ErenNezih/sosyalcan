import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

/**
 * POST /api/payments/instances/[id]/mark-paid
 * Marks instance as paid, creates Transaction, links transactionId.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const instance = await prisma.paymentInstance.findUnique({
      where: { id, archivedAt: null },
      include: { plan: true },
    });

    if (!instance) {
      return NextResponse.json(apiError("NOT_FOUND", "Ödeme bulunamadı"), { status: 404 });
    }

    if (instance.status === "paid") {
      return NextResponse.json(apiError("VALIDATION_ERROR", "Bu ödeme zaten alındı"), {
        status: 400,
      });
    }

    const paidAt = new Date();

    const transaction = await prisma.transaction.create({
      data: {
        type: "income",
        amountKurus: instance.amountKurus,
        dateAt: paidAt,
        customerId: instance.customerId,
        notes: `Ödeme: ${instance.plan?.title ?? "Plan"} (${instance.month})`,
      },
    });

    await prisma.paymentInstance.update({
      where: { id },
      data: { status: "paid", paidAt, transactionId: transaction.id },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id,
        status: "paid",
        paidAt: paidAt.toISOString(),
        transactionId: transaction.id,
      },
    });
  } catch (e) {
    console.error("[api/payments/instances mark-paid]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Ödeme işaretlenemedi"), { status: 500 });
  }
}
