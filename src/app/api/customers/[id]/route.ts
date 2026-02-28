import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  sector: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    return NextResponse.json(apiError("NOT_FOUND", "Müşteri bulunamadı"), { status: 404 });
  }

  return NextResponse.json({
    ...customer,
    archivedAt: customer.archivedAt?.toISOString() ?? null,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  });
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(parsed.data.name != null && { name: parsed.data.name }),
        ...(parsed.data.email != null && { email: parsed.data.email }),
        ...(parsed.data.phone != null && { phone: parsed.data.phone }),
        ...(parsed.data.company != null && { company: parsed.data.company }),
        ...(parsed.data.sector != null && { sector: parsed.data.sector }),
        ...(parsed.data.notes != null && { notes: parsed.data.notes }),
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        ...customer,
        archivedAt: customer.archivedAt?.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      },
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2025") {
      return NextResponse.json(apiError("NOT_FOUND", "Müşteri bulunamadı"), { status: 404 });
    }
    console.error("[api/customers PATCH]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Müşteri güncellenemedi"), { status: 500 });
  }
}
