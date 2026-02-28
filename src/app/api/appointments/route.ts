import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu"),
  description: z.string().optional(),
  start: z.string().min(1, "Başlangıç zorunlu"),
  end: z.string().min(1, "Bitiş zorunlu"),
  type: z.enum(["crm", "todo", "finance"]).default("crm"),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

function toResponse(a: {
  id: string;
  title: string;
  type: string;
  startAt: Date;
  endAt: Date;
  customerId: string | null;
  notes: string | null;
  meetLink: string | null;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: a.id,
    title: a.title,
    type: a.type,
    start: a.startAt.toISOString(),
    end: a.endAt.toISOString(),
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    relatedId: a.customerId,
    relatedType: a.customerId ? "Customer" : null,
    description: a.notes,
    notes: a.notes,
    meetLink: a.meetLink,
    archivedAt: a.archivedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const archived = url.searchParams.get("archived");

  if (!from || !to) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "from ve to zorunlu"), { status: 400 });
  }

  try {
    const where: { startAt?: { gte: Date; lte: Date }; archivedAt?: { not: null } | null } = {
      startAt: { gte: new Date(from), lte: new Date(to) },
    };
    if (archived === "true") where.archivedAt = { not: null };
    else if (archived !== "all") where.archivedAt = null;

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { startAt: "asc" },
    });

    return NextResponse.json(appointments.map(toResponse));
  } catch (e) {
    console.error("[api/appointments GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Randevular yüklenemedi"), { status: 500 });
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
    const customerId = data.relatedType === "Customer" && data.relatedId ? data.relatedId : null;

    const appointment = await prisma.appointment.create({
      data: {
        title: data.title,
        type: data.type,
        startAt: new Date(data.start),
        endAt: new Date(data.end),
        customerId,
        notes: data.description ?? null,
      },
    });

    return NextResponse.json(toResponse(appointment));
  } catch (e) {
    console.error("[api/appointments POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Randevu oluşturulamadı"), { status: 500 });
  }
}
