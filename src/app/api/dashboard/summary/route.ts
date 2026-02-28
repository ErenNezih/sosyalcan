import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

/**
 * GET /api/dashboard/summary?month=YYYY-MM
 * Returns: netRevenueKurus, tasksDueSoon, appointmentsToday, overdueTasks
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month");
  const now = new Date();
  const month = monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(year, monthNum - 1, 1));
  const monthEnd = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setUTCHours(23, 59, 59, 999);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  try {
    const [income, expense, tasksDueSoon, appointmentsToday, overdueTasks] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          archivedAt: null,
          type: "income",
          dateAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountKurus: true },
      }),
      prisma.transaction.aggregate({
        where: {
          archivedAt: null,
          type: "expense",
          dateAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amountKurus: true },
      }),
      prisma.task.findMany({
        where: {
          archivedAt: null,
          status: { not: "TAMAMLANDI" },
          dueAt: { gte: todayStart, lte: weekEnd },
        },
        orderBy: { dueAt: "asc" },
        take: 10,
      }),
      prisma.appointment.findMany({
        where: {
          archivedAt: null,
          startAt: { gte: todayStart, lte: todayEnd },
        },
        orderBy: { startAt: "asc" },
      }),
      prisma.task.findMany({
        where: {
          archivedAt: null,
          status: { not: "TAMAMLANDI" },
          dueAt: { lt: todayStart },
        },
        orderBy: { dueAt: "asc" },
        take: 10,
      }),
    ]);

    const netRevenueKurus = (income._sum.amountKurus ?? 0) - (expense._sum.amountKurus ?? 0);

    return NextResponse.json({
      ok: true,
      data: {
        netRevenueKurus,
        tasksDueSoon: tasksDueSoon.map((t) => ({
          id: t.id,
          title: t.title,
          dueAt: t.dueAt?.toISOString(),
          status: t.status,
        })),
        appointmentsToday: appointmentsToday.map((a) => ({
          id: a.id,
          title: a.title,
          startAt: a.startAt.toISOString(),
          endAt: a.endAt.toISOString(),
        })),
        overdueTasks: overdueTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueAt: t.dueAt?.toISOString(),
          status: t.status,
        })),
      },
    });
  } catch (e) {
    console.error("[api/dashboard/summary]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Özet yüklenemedi"), { status: 500 });
  }
}
