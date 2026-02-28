import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";
import { ensureMonthInstances } from "@/lib/payments";

/**
 * GET /api/payments/instances?month=YYYY-MM&status=
 * Ensures instances exist for the month (idempotent), then returns them.
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const statusParam = url.searchParams.get("status");
    const now = new Date();
    const month =
      monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await ensureMonthInstances(month);

    const where: { archivedAt: null; month: string; status?: string } = { archivedAt: null, month };
    if (statusParam) where.status = statusParam;

    const instances = await prisma.paymentInstance.findMany({
      where,
      include: { plan: { include: { customer: true } } },
      orderBy: { dueAt: "asc" },
    });

    return NextResponse.json({
      ok: true,
      data: instances.map((i) => ({
        id: i.id,
        planId: i.planId,
        customerId: i.customerId,
        customer: i.plan?.customer ? { id: i.plan.customer.id, name: i.plan.customer.name } : null,
        planTitle: i.plan?.title ?? null,
        month: i.month,
        dueAt: i.dueAt.toISOString(),
        amountKurus: i.amountKurus,
        status: i.status,
        paidAt: i.paidAt?.toISOString() ?? null,
        transactionId: i.transactionId,
      })),
    });
  } catch (e) {
    console.error("[api/payments/instances GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Ödemeler yüklenemedi"), { status: 500 });
  }
}
