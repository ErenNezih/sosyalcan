import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

/**
 * GET /api/finance/distribution?month=YYYY-MM
 * Returns monthly income distribution: UserA 35%, UserB 35%, Investment 30%
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const now = new Date();
    const month = monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthNum] = month.split("-").map(Number);
    const monthStart = new Date(Date.UTC(year, monthNum - 1, 1));
    const monthEnd = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    const incomeResult = await prisma.transaction.aggregate({
      where: {
        archivedAt: null,
        type: "income",
        dateAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amountKurus: true },
    });
    const totalIncomeKurus = incomeResult._sum.amountKurus ?? 0;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      take: 2,
    });
    const userA = users[0];
    const userB = users[1];

    const share35 = Math.floor(totalIncomeKurus * 0.35);
    const userAShareKurus = share35;
    const userBShareKurus = share35;
    const investmentShareKurus = totalIncomeKurus - userAShareKurus - userBShareKurus;

    return NextResponse.json({
      ok: true,
      data: {
        month,
        totalIncomeKurus,
        userA: userA ? { id: userA.id, name: userA.name, shareKurus: userAShareKurus } : null,
        userB: userB ? { id: userB.id, name: userB.name, shareKurus: userBShareKurus } : null,
        investmentShareKurus,
      },
    });
  } catch (e) {
    console.error("[api/finance/distribution]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Dağıtım hesaplanamadı"), { status: 500 });
  }
}
