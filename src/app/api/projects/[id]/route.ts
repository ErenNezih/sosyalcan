import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const updateSchema = z
  .object({
    title: z.string().min(2).optional(),
    name: z.string().min(1).optional(),
    shootType: z.enum(["video", "drone"]).optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    customerId: z.string().optional(),
    assigneeId: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["planlandi", "cekimde", "kurgu", "revize", "teslim", "active", "on_hold", "done"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    budget: z.number().int().nonnegative().optional(),
  })
  .refine(
    (d) => {
      const start = d.startAt ?? d.startDate;
      const end = d.endAt ?? d.dueDate;
      if (!start || !end) return true;
      return new Date(end) > new Date(start);
    },
    { message: "Bitiş tarihi başlangıçtan sonra olmalı", path: ["endAt"] }
  );

type ProjectWithRelations = {
  id: string;
  name: string;
  customerId: string | null;
  status: string;
  priority: string;
  startAt: Date | null;
  dueAt: Date | null;
  endAt: Date | null;
  shootType: string;
  location: string | null;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  customer: { id: string; name: string } | null;
  budgetKurus: number;
  notes: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toResponse(p: ProjectWithRelations) {
  return {
    id: p.id,
    name: p.name,
    customerId: p.customerId ?? undefined,
    customer: p.customer ? { id: p.customer.id, name: p.customer.name } : null,
    status: p.status,
    priority: p.priority,
    startDate: p.startAt?.toISOString() ?? null,
    dueDate: p.dueAt?.toISOString() ?? null,
    endAt: p.endAt?.toISOString() ?? null,
    shootType: p.shootType ?? "video",
    location: p.location ?? null,
    assigneeId: p.assigneeId ?? undefined,
    assignee: p.assignee ? { id: p.assignee.id, name: p.assignee.name, email: p.assignee.email } : null,
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
    include: { customer: true, assignee: { select: { id: true, name: true, email: true } } },
  });

  if (!project) {
    return NextResponse.json(apiError("NOT_FOUND", "Çekim bulunamadı"), { status: 404 });
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

    const d = parsed.data;
    const data: Record<string, unknown> = {};
    if (d.name != null) data.name = d.name;
    else if (d.title != null) data.name = d.title;
    if (d.customerId !== undefined) data.customerId = d.customerId || null;
    if (d.assigneeId !== undefined) data.assigneeId = d.assigneeId || null;
    if (d.status != null) data.status = d.status;
    if (d.priority != null) data.priority = d.priority;
    if (d.shootType != null) data.shootType = d.shootType;
    if (d.location !== undefined) data.location = d.location || null;
    if (d.startAt != null) data.startAt = new Date(d.startAt);
    else if (d.startDate != null) data.startAt = d.startDate ? new Date(d.startDate) : null;
    if (d.endAt != null) data.endAt = new Date(d.endAt);
    else if (d.dueDate != null) data.dueAt = d.dueDate ? new Date(d.dueDate) : null;
    if (d.budget != null) data.budgetKurus = d.budget;
    if (d.notes !== undefined) data.notes = d.notes;

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(toResponse(project));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "Çekim bulunamadı"), { status: 404 });
    }
    console.error("[api/projects PATCH]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Çekim güncellenemedi"), { status: 500 });
  }
}
