import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";
import { ensureMonthInstances, getPaymentSignal } from "@/lib/payments";

/**
 * GET /api/payments/alerts?month=YYYY-MM
 * Returns upcoming, paymentWindow, overdue for dashboard.
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const now = new Date();
    const month =
      monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    await ensureMonthInstances(month);

    const [year, monthNum] = month.split("-").map(Number);
    const monthStart = new Date(Date.UTC(year, monthNum - 1, 1));
    const monthEnd = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const instances = await prisma.paymentInstance.findMany({
      where: { archivedAt: null, dueAt: { gte: monthStart, lte: monthEnd } },
      include: { plan: { include: { customer: true } } },
      orderBy: { dueAt: "asc" },
    });

    type AlertItem = {
      id: string;
      customerName: string;
      planTitle: string;
      dueAt: string;
      amountKurus: number;
      signal: string;
    };

    const upcoming: AlertItem[] = [];
    const paymentWindow: AlertItem[] = [];
    const overdue: AlertItem[] = [];

    for (const i of instances) {
      const signal = getPaymentSignal(i.dueAt, now, i.status);
      const item: AlertItem = {
        id: i.id,
        customerName: i.plan?.customer?.name ?? "—",
        planTitle: i.plan?.title ?? "—",
        dueAt: i.dueAt.toISOString(),
        amountKurus: i.amountKurus,
        signal,
      };
      if (signal === "paid") continue;
      if (signal === "overdue") overdue.push(item);
      else if (signal === "paymentWindow") paymentWindow.push(item);
      else if (signal === "upcoming") upcoming.push(item);
    }

    return NextResponse.json({
      ok: true,
      data: { upcoming, paymentWindow, overdue },
    });
  } catch (e) {
    console.error("[api/payments/alerts GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Uyarılar yüklenemedi"), { status: 500 });
  }
}
