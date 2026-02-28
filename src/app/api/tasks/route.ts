import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu"),
  description: z.string().optional(),
  status: z.enum(["BEKLEYEN", "KURGUDA", "REVIZEDE", "TAMAMLANDI"]).default("BEKLEYEN"),
  assigneeId: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
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

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const day = url.searchParams.get("day");
    const archived = url.searchParams.get("archived");

    let fromISO = from;
    let toISO = to;
    if (day && !from && !to) {
      fromISO = `${day}T00:00:00.000Z`;
      toISO = `${day}T23:59:59.999Z`;
    } else if (!from && !to && !day) {
      const today = new Date().toISOString().slice(0, 10);
      fromISO = `${today}T00:00:00.000Z`;
      toISO = `${today}T23:59:59.999Z`;
    }

    const where: { archivedAt?: { not: null } | null; dueAt?: { gte?: Date; lte?: Date } } = {};
    if (archived === "true") where.archivedAt = { not: null };
    else if (archived !== "all") where.archivedAt = null;
    if (fromISO && toISO) {
      where.dueAt = { gte: new Date(fromISO), lte: new Date(toISO) };
    }

    const orderBy: { dueAt?: "asc"; order?: "asc" }[] = fromISO && toISO
      ? [{ dueAt: "asc" }, { order: "asc" }]
      : [{ order: "asc" }];

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(tasks.map((t) => toResponse({ ...t, assignee: t.assignee })));
  } catch (e) {
    console.error("[api/tasks GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Görevler yüklenemedi"), { status: 500 });
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
    const statusVal = data.status ?? "BEKLEYEN";
    const maxOrder = await prisma.task
      .aggregate({ where: { status: statusVal }, _max: { order: true } })
      .then((r) => (r._max.order ?? -1) + 1);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? null,
        status: statusVal,
        priority: data.urgency ?? "medium",
        assigneeId: data.assigneeId ?? null,
        dueAt: data.dueDate ? new Date(data.dueDate) : null,
        order: maxOrder,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(toResponse(task));
  } catch (e) {
    console.error("[api/tasks POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Görev oluşturulamadı"), { status: 500 });
  }
}
