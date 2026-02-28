import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

/**
 * Unified calendar: appointments + tasks as events.
 * GET /api/calendar?from=ISO&to=ISO&types=crm,todo,finance
 */
export async function GET(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const typesParam = url.searchParams.get("types") ?? "crm,todo";
  const types = new Set(typesParam.split(",").map((t) => t.trim().toLowerCase()));

  if (!from || !to) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "from ve to zorunlu"), { status: 400 });
  }

  const events: Array<{
    id: string;
    source: "task" | "appointment" | "shoot";
    title: string;
    start_at: string;
    end_at: string;
    type: string;
    related_id?: string | null;
    assignee?: string | null;
    assigneeEmail?: string | null;
    shootType?: string;
    customer?: { id: string; name: string } | null;
    status?: string;
  }> = [];

  try {
    if (types.has("crm") || types.has("todo") || types.has("finance")) {
      const appointments = await prisma.appointment.findMany({
        where: {
          archivedAt: null,
          startAt: { gte: new Date(from), lte: new Date(to) },
        },
        orderBy: { startAt: "asc" },
      });

      for (const a of appointments) {
        const includeCrm = types.has("crm") && (a.type === "crm" || !a.type);
        const includeFinance = types.has("finance") && a.type === "finance";
        const includeTodo = types.has("todo") && a.type === "todo";
        if (includeCrm || includeFinance || includeTodo) {
          events.push({
            id: a.id,
            source: "appointment",
            title: a.title,
            start_at: a.startAt.toISOString(),
            end_at: a.endAt.toISOString(),
            type: a.type || "crm",
            related_id: a.customerId,
            assignee: null,
            assigneeEmail: null,
          });
        }
      }
    }

    if (types.has("shoot")) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const shoots = await prisma.project.findMany({
        where: {
          archivedAt: null,
          startAt: { not: null },
          OR: [
            { endAt: { not: null } },
            { dueAt: { not: null } },
          ],
        },
        include: {
          customer: { select: { id: true, name: true } },
          assignee: { select: { name: true, email: true } },
        },
      });

      for (const s of shoots) {
        const startAt = s.startAt;
        const endAt = s.endAt ?? s.dueAt;
        if (!startAt || !endAt) continue;
        const sStart = startAt.getTime();
        const sEnd = endAt.getTime();
        const fromMs = fromDate.getTime();
        const toMs = toDate.getTime();
        const overlaps = sStart <= toMs && sEnd >= fromMs;
        if (!overlaps) continue;

        const shootType = (s.shootType ?? "video").toUpperCase();
        events.push({
          id: s.id,
          source: "shoot",
          title: `[${shootType}] ${s.name}`,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          type: "shoot",
          assignee: s.assignee?.name ?? s.assignee?.email ?? null,
          assigneeEmail: s.assignee?.email ?? null,
          shootType: s.shootType ?? "video",
          customer: s.customer ? { id: s.customer.id, name: s.customer.name } : null,
          status: s.status,
        });
      }
    }

    if (types.has("todo")) {
      const tasks = await prisma.task.findMany({
        where: {
          archivedAt: null,
          dueAt: { gte: new Date(from), lte: new Date(to), not: null },
        },
        orderBy: { dueAt: "asc" },
        include: { assignee: { select: { name: true, email: true } } },
      });

      for (const t of tasks) {
        const due = t.dueAt;
        if (!due) continue;
        const d = new Date(due);
        d.setUTCHours(9, 0, 0, 0);
        const endD = new Date(d);
        endD.setUTCHours(10, 0, 0, 0);
        events.push({
          id: t.id,
          source: "task",
          title: t.title,
          start_at: d.toISOString(),
          end_at: endD.toISOString(),
          type: "todo",
          assignee: t.assignee?.name ?? t.assignee?.email ?? null,
          assigneeEmail: t.assignee?.email ?? null,
        });
      }
    }

    events.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

    return NextResponse.json({ events });
  } catch (e) {
    console.error("[api/calendar]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Takvim yüklenemedi"), { status: 500 });
  }
}
