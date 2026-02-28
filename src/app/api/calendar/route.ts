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
    source: "task" | "appointment";
    title: string;
    start_at: string;
    end_at: string;
    type: string;
    related_id?: string | null;
    assignee?: string | null;
    assigneeEmail?: string | null;
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
