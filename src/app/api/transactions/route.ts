import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Tutar pozitif olmalı"),
  date: z.union([z.string(), z.coerce.date()]),
  customerId: z.string().optional().nullable(),
  notes: z.string().optional(),
  description: z.string().optional(),
});

function toResponse(t: {
  id: string;
  type: string;
  amountKurus: number;
  dateAt: Date;
  customerId: string | null;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: t.id,
    type: t.type,
    amount: t.amountKurus / 100,
    amountKurus: t.amountKurus,
    date: t.dateAt.toISOString(),
    dateAt: t.dateAt.toISOString(),
    customerId: t.customerId,
    notes: t.notes,
    description: t.notes,
    archivedAt: t.archivedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const archived = url.searchParams.get("archived");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

    const where: { dateAt?: { gte?: Date; lte?: Date }; archivedAt?: { not: null } | null } = {};
    if (archived === "true") where.archivedAt = { not: null };
    else if (archived !== "all") where.archivedAt = null;
    if (from || to) {
      where.dateAt = {};
      if (from) where.dateAt.gte = new Date(from);
      if (to) where.dateAt.lte = new Date(to);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { dateAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      total: transactions.length,
      documents: transactions.map(toResponse),
    });
  } catch (e) {
    console.error("[api/transactions GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "İşlemler yüklenemedi"), { status: 500 });
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
    const amountKurus = Math.round((data.amount ?? 0) * 100);
    const dateAt = typeof data.date === "string" ? new Date(data.date) : data.date;

    const transaction = await prisma.transaction.create({
      data: {
        type: data.type,
        amountKurus,
        dateAt,
        customerId: data.customerId ?? null,
        notes: data.notes ?? data.description ?? null,
      },
    });

    return NextResponse.json(toResponse(transaction));
  } catch (e) {
    console.error("[api/transactions POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "İşlem kaydedilemedi"), { status: 500 });
  }
}
