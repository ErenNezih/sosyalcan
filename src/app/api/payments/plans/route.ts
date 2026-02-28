import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1, "Başlık gerekli"),
  amountKurus: z.number().int().nonnegative().optional(),
  amount: z.number().nonnegative().optional(),
  billingDay: z.number().int().min(1).max(28),
});

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId");

    const where: { archivedAt: null; customerId?: string } = { archivedAt: null };
    if (customerId) where.customerId = customerId;

    const plans = await prisma.paymentPlan.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      ok: true,
      data: plans.map((p) => ({
        id: p.id,
        customerId: p.customerId,
        customer: p.customer ? { id: p.customer.id, name: p.customer.name } : null,
        title: p.title,
        amountKurus: p.amountKurus,
        billingDay: p.billingDay,
        status: p.status,
        archivedAt: p.archivedAt?.toISOString() ?? null,
      })),
    });
  } catch (e) {
    console.error("[api/payments/plans GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Planlar yüklenemedi"), { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const data = parsed.data;
    const amountKurus = data.amountKurus ?? (data.amount ? Math.round(data.amount * 100) : 0);

    const plan = await prisma.paymentPlan.create({
      data: {
        customerId: data.customerId,
        title: data.title,
        amountKurus,
        billingDay: data.billingDay,
      },
      include: { customer: true },
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: plan.id,
        customerId: plan.customerId,
        customer: plan.customer ? { id: plan.customer.id, name: plan.customer.name } : null,
        title: plan.title,
        amountKurus: plan.amountKurus,
        billingDay: plan.billingDay,
        status: plan.status,
      },
    });
  } catch (e) {
    console.error("[api/payments/plans POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Plan oluşturulamadı"), { status: 500 });
  }
}
