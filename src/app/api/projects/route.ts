import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z
  .object({
    title: z.string().min(2, "Çekim adı en az 2 karakter olmalı"),
    shootType: z.enum(["video", "drone"]),
    startAt: z.string(),
    endAt: z.string(),
    customerId: z.string().optional(),
    assigneeId: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["planlandi", "cekimde", "kurgu", "revize", "teslim"]).default("planlandi"),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "Bitiş tarihi başlangıçtan sonra olmalı",
    path: ["endAt"],
  });

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
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      total: projects.length,
      documents: projects.map(toResponse),
    });
  } catch (e) {
    console.error("[api/projects GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Çekimler yüklenemedi"), { status: 500 });
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
        name: data.title,
        customerId: data.customerId ?? null,
        assigneeId: data.assigneeId ?? null,
        status: data.status,
        shootType: data.shootType,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        location: data.location ?? null,
        notes: data.notes ?? null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(toResponse(project));
  } catch (e) {
    console.error("[api/projects POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Çekim oluşturulamadı"), { status: 500 });
  }
}
