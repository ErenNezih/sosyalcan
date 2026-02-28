import { prisma } from "@/lib/db";

const BILLING_DAY_MAX = 28;

/**
 * Ensure PaymentInstance rows exist for the given month for all active plans.
 * Idempotent: uses @@unique(planId, month).
 */
export async function ensureMonthInstances(month: string): Promise<void> {
  const [year, monthNum] = month.split("-").map(Number);
  const day = Math.min(BILLING_DAY_MAX, new Date(year, monthNum, 0).getDate());
  const dueAt = new Date(Date.UTC(year, monthNum - 1, day, 12, 0, 0, 0));

  const plans = await prisma.paymentPlan.findMany({
    where: { archivedAt: null, status: "active" },
  });

  for (const plan of plans) {
    await prisma.paymentInstance.upsert({
      where: { planId_month: { planId: plan.id, month } },
      create: {
        planId: plan.id,
        customerId: plan.customerId,
        month,
        dueAt,
        amountKurus: plan.amountKurus,
        status: "due",
      },
      update: {},
    });
  }
}

/**
 * Get payment signal for UI: paid | overdue | upcoming | paymentWindow | normal
 */
export function getPaymentSignal(
  dueAt: Date,
  now: Date,
  status: string
): "paid" | "overdue" | "upcoming" | "paymentWindow" | "normal" {
  if (status === "paid") return "paid";
  const dueStart = new Date(dueAt);
  dueStart.setUTCHours(0, 0, 0, 0);
  const dueEnd = new Date(dueAt);
  dueEnd.setUTCHours(23, 59, 59, 999);

  const nowStart = new Date(now);
  nowStart.setUTCHours(0, 0, 0, 0);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.ceil((dueStart.getTime() - nowStart.getTime()) / msPerDay);

  if (daysDiff < -1) return "overdue";
  if (daysDiff >= -1 && daysDiff <= 1) return "paymentWindow";
  if (daysDiff >= 2 && daysDiff <= 3) return "upcoming";
  return "normal";
}
