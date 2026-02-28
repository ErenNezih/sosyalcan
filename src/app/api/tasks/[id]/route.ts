import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["BEKLEYEN", "KURGUDA", "REVIZEDE", "TAMAMLANDI"]).optional(),
  assigneeId: z.string().optional().nullable(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().optional().nullable(),
  order: z.number().int().optional(),
});

function toResponse(t: {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  order: number;
  assigneeId: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: { id: string; name: string | null; email: string } | null;
}) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    urgency: t.priority,
    dueDate: t.dueAt?.toISOString() ?? null,
    order: t.order,
    assigneeId: t.assigneeId,
    archivedAt: t.archivedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    assignee: t.assignee ?? null,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: { assignee: { select: { id: true, name: true, email: true } } },
  });

  if (!task) {
    return NextResponse.json(apiError("NOT_FOUND", "Görev bulunamadı"), { status: 404 });
  }

  return NextResponse.json(toResponse(task));
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
    if (parsed.data.title != null) data.title = parsed.data.title;
    if (parsed.data.description != null) data.description = parsed.data.description;
    if (parsed.data.status != null) data.status = parsed.data.status;
    if (parsed.data.assigneeId !== undefined) data.assigneeId = parsed.data.assigneeId || null;
    if (parsed.data.urgency != null) data.priority = parsed.data.urgency;
    if (parsed.data.dueDate !== undefined) data.dueAt = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    if (parsed.data.order != null) data.order = parsed.data.order;

    const task = await prisma.task.update({
      where: { id },
      data,
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(toResponse(task));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "Görev bulunamadı"), { status: 404 });
    }
    console.error("[api/tasks PATCH]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Görev güncellenemedi"), { status: 500 });
  }
}
