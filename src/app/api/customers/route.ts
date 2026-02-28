import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

const createSchema = z.object({
  name: z.string().min(1, "İsim zorunlu"),
  email: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  sector: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const archived = url.searchParams.get("archived");
    const withContactStatus = url.searchParams.get("withContactStatus") === "1";

    const where =
      archived === "true"
        ? { archivedAt: { not: null } }
        : archived === "all"
          ? {}
          : { archivedAt: null };

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (!withContactStatus) {
      return NextResponse.json(
        customers.map((c) => ({
          ...c,
          archivedAt: c.archivedAt?.toISOString() ?? null,
          createdAt: c.createdAt.toISOString(),
          updatedAt: c.updatedAt.toISOString(),
        }))
      );
    }

    const lastAppointments = await prisma.appointment.findMany({
      where: { customerId: { in: customers.map((c) => c.id) }, archivedAt: null },
      select: { customerId: true, startAt: true },
      orderBy: { startAt: "desc" },
    });

    const lastByCustomer = new Map<string, Date>();
    for (const a of lastAppointments) {
      if (a.customerId && !lastByCustomer.has(a.customerId)) {
        lastByCustomer.set(a.customerId, a.startAt);
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const CONTACT_YELLOW_DAYS = 20;
    const CONTACT_RED_DAYS = 35;

    const withStatus = customers.map((c) => {
      const last = lastByCustomer.get(c.id);
      const daysSince = last
        ? Math.floor((now.getTime() - new Date(last).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
        : null;
      let pulse: "green" | "yellow" | "red" = "green";
      if (daysSince != null) {
        if (daysSince > CONTACT_RED_DAYS) pulse = "red";
        else if (daysSince > CONTACT_YELLOW_DAYS) pulse = "yellow";
      }
      return {
        ...c,
        archivedAt: c.archivedAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        lastContactAt: last?.toISOString() ?? null,
        daysSinceContact: daysSince,
        contactPulse: pulse,
      };
    });

    return NextResponse.json(withStatus);
  } catch (e) {
    console.error("[api/customers GET]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Müşteriler yüklenemedi"), { status: 500 });
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
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        company: data.company ?? null,
        sector: data.sector ?? null,
        notes: data.notes ?? null,
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
  } catch (e) {
    console.error("[api/customers POST]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Müşteri oluşturulamadı"), { status: 500 });
  }
}
