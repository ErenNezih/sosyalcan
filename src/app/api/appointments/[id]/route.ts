import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  type: z.string().optional(),
  relatedId: z.string().optional().nullable(),
  relatedType: z.string().optional().nullable(),
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({ where: { id } });

  if (!appointment) {
    return NextResponse.json(apiError("NOT_FOUND", "Randevu bulunamadı"), { status: 404 });
  }

  return NextResponse.json(toResponse(appointment));
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
    if (parsed.data.description != null) data.notes = parsed.data.description;
    if (parsed.data.start != null) data.startAt = new Date(parsed.data.start);
    if (parsed.data.end != null) data.endAt = new Date(parsed.data.end);
    if (parsed.data.type != null) data.type = parsed.data.type;
    if (parsed.data.relatedId !== undefined || parsed.data.relatedType !== undefined) {
      data.customerId = parsed.data.relatedType === "Customer" && parsed.data.relatedId ? parsed.data.relatedId : null;
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });

    return NextResponse.json(toResponse(appointment));
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "Randevu bulunamadı"), { status: 404 });
    }
    console.error("[api/appointments PATCH]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Randevu güncellenemedi"), { status: 500 });
  }
}
