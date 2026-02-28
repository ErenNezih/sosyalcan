import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  customerId: z.string().optional(),
  status: z.enum(["active", "on_hold", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!project) {
    return NextResponse.json(apiError("NOT_FOUND", "Proje bulunamadı"), { status: 404 });
  }

  return NextResponse.json(toResponse(project));
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        apiError("VALIDATION_ERROR", "Geçersiz veri", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name != null) data.name = parsed.data.name;
    if (parsed.data.customerId != null) data.customerId = parsed.data.customerId || null;
    if (parsed.data.status != null) data.status = parsed.data.status;
    if (parsed.data.priority != null) data.priority = parsed.data.priority;
    if (parsed.data.startDate != null) data.startAt = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
    if (parsed.data.dueDate != null) data.dueAt = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.budget != null) data.budgetKurus = parsed.data.budget;
    if (parsed.data.notes != null) data.notes = parsed.data.notes;

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(toResponse(project));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "Proje bulunamadı"), { status: 404 });
    }
    console.error("[api/projects PATCH]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Proje güncellenemedi"), { status: 500 });
  }
}
