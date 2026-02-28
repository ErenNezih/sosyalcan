import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList } from "@/lib/appwrite/helpers";

/**
 * Unified calendar endpoint: appointments + tasks in one response.
 * GET /api/calendar?from=ISO&to=ISO&types=crm,todo,finance
 * types: comma-separated, default "crm,todo" (finance = appointments with type=finance)
 */
export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const typesParam = searchParams.get("types") ?? "crm,todo";
  const types = new Set(typesParam.split(",").map((t) => t.trim().toLowerCase()));

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }

  const { databases, users } = getAppwriteAdmin();
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
    raw?: Record<string, unknown>;
  }> = [];

  if (types.has("crm") || types.has("todo") || types.has("finance")) {
    const appointmentsRes = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.appointments,
      [
        Query.notEqual("is_deleted", true),
        Query.greaterThanEqual("start", from),
        Query.lessThanEqual("start", to),
        Query.orderAsc("start"),
      ]
    );
    const appointments = mapDocumentList<Record<string, unknown>>(appointmentsRes);
    for (const a of appointments) {
      const apt = a as unknown as { id: string; title?: string; start?: string; end?: string; type?: string; related_id?: string; related_type?: string };
      if (!apt.title || !apt.start || !apt.end) continue;
      const includeCrm = types.has("crm") && (apt.type === "crm" || !apt.type);
      const includeFinance = types.has("finance") && apt.type === "finance";
      const includeTodo = types.has("todo") && apt.type === "todo";
      if (includeCrm || includeFinance || includeTodo) {
        events.push({
          id: apt.id,
          source: "appointment",
          title: apt.title,
          start_at: apt.start,
          end_at: apt.end,
          type: apt.type || "crm",
          related_id: apt.related_id ?? null,
          assignee: null,
          assigneeEmail: null,
          raw: apt,
        });
      }
    }
  }

  if (types.has("todo")) {
    const tasksRes = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.tasks,
      [
        Query.notEqual("is_deleted", true),
        Query.greaterThanEqual("due_date", from),
        Query.lessThanEqual("due_date", to),
        Query.orderAsc("due_date"),
      ]
    );
    const tasks = mapDocumentList<Record<string, unknown>>(tasksRes);
    const usersList = await users.list();
    const userMap = new Map(usersList.users.map((u) => [u.$id, { name: u.name ?? u.email, email: u.email }]));
    for (const t of tasks) {
      const task = t as unknown as { id: string; title?: string; due_date?: string; assignee_id?: string; status?: string };
      const due = task.due_date;
      if (!due || !task.title) continue;
      const d = new Date(due);
      d.setHours(9, 0, 0, 0);
      const endD = new Date(d);
      endD.setHours(10, 0, 0, 0);
      const assignee = task.assignee_id ? userMap.get(task.assignee_id) : null;
      events.push({
        id: task.id,
        source: "task",
        title: task.title,
        start_at: d.toISOString(),
        end_at: endD.toISOString(),
        type: "todo",
        assignee: assignee?.name ?? null,
        assigneeEmail: assignee?.email ?? null,
        raw: task,
      });
    }
  }

  events.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  return NextResponse.json({ events });
}
