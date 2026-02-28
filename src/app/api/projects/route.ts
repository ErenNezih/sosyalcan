import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  name: z.string().min(1, "Proje adı zorunlu"),
  customerId: z.string().optional(),
  status: z.enum(["active", "on_hold", "done"]).default("active"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

function toResponse(p: { id: string; name: string; customerId: string | null; status: string; priority: string; startAt: Date | null; dueAt: Date | null; budgetKurus: number; notes: string | null; archivedAt: Date | null; createdAt: Date; updatedAt: Date }) {
  return {
    id: p.id,
    name: p.name,
    customerId: p.customerId ?? undefined,
    status: p.status,
    priority: p.priority,
    startDate: p.startAt?.toISOString() ?? null,
    dueDate: p.dueAt?.toISOString() ?? null,
    budget: p.budgetKurus,
    notes: p.notes ?? null,
    archivedAt: p.archivedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const archived = url.searchParams.get("archived");
    const customerId = url.searchParams.get("customerId");

    const where: { archivedAt?: { not: null } | null; customerId?: string } = {};
    if (archived === "true") where.archivedAt = { not: null };
    else if (archived !== "all") where.archivedAt = null;
    if (customerId) where.customerId = customerId;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      total: projects.length,
      documents: projects.map(toResponse),
    });
  } catch (e) {
    console.error("[api/projects GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Projeler yüklenemedi"), { status: 500 });
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
    const project = await prisma.project.create({
      data: {
        name: data.name,
        customerId: data.customerId ?? null,
        status: data.status,
        priority: data.priority,
        startAt: data.startDate ? new Date(data.startDate) : null,
        dueAt: data.dueDate ? new Date(data.dueDate) : null,
        budgetKurus: data.budget ?? 0,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json(toResponse(project));
  } catch (e) {
    console.error("[api/projects POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Proje oluşturulamadı"), { status: 500 });
  }
}
