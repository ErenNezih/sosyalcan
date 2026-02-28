import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { z } from "zod";

const taskSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().optional(),
  status: z.enum(["BEKLEYEN", "KURGUDA", "REVIZEDE", "TAMAMLANDI"]).default("BEKLEYEN"),
  assigneeId: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.string().optional(),
});

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.tasks;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.url ? new URL(request.url) : null;
  const from = url?.searchParams.get("from");
  const to = url?.searchParams.get("to");
  const day = url?.searchParams.get("day"); // YYYY-MM-DD
  const archived = url?.searchParams.get("archived");

  const { databases, users } = getAppwriteAdmin();

  const archiveFilter = archived === "true"
    ? [Query.equal("is_deleted", true)]
    : archived === "all"
      ? []
      : [Query.notEqual("is_deleted", true)];

  let fromISO = from;
  let toISO = to;
  if (day && !from && !to) {
    fromISO = day + "T00:00:00.000Z";
    toISO = day + "T23:59:59.999Z";
  } else if (!from && !to && !day) {
    const today = new Date().toISOString().slice(0, 10);
    fromISO = today + "T00:00:00.000Z";
    toISO = today + "T23:59:59.999Z";
  }

  if (fromISO && toISO) {
    const res = await databases.listDocuments(dbId, coll, [
      ...archiveFilter,
      Query.greaterThanEqual("due_date", fromISO),
      Query.lessThanEqual("due_date", toISO),
      Query.orderAsc("due_date"),
      Query.orderAsc("order"),
    ]);
    const list = mapDocumentList(res);
    const usersList = await users.list();
    const userMap = new Map(usersList.users.map((u) => [u.$id, { id: u.$id, name: u.name ?? null, email: u.email }]));
    const mapped = list.map((t: Record<string, unknown>) => ({
      ...t,
      dueDate: t.due_date ?? null,
      assigneeId: t.assignee_id ?? null,
      assignee: t.assignee_id ? userMap.get(t.assignee_id as string) ?? null : null,
    }));
    return NextResponse.json(mapped);
  }

  const res = await databases.listDocuments(dbId, coll, [
    ...archiveFilter,
    Query.orderAsc("status"),
    Query.orderAsc("order"),
  ]);
  const list = mapDocumentList(res);
  const usersList = await users.list();
  const userMap = new Map(usersList.users.map((u) => [u.$id, { id: u.$id, name: u.name ?? null, email: u.email }]));
  const mapped = list.map((t: Record<string, unknown>) => ({
    ...t,
    dueDate: t.due_date ?? null,
    assigneeId: t.assignee_id ?? null,
    assignee: t.assignee_id ? userMap.get(t.assignee_id as string) ?? null : null,
  }));
  return NextResponse.json(mapped);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
  }

  const { title, description, status, assigneeId, urgency, dueDate } = parsed.data;
  const statusVal = status ?? "BEKLEYEN";
  const existing = await getAppwriteAdmin().databases.listDocuments(dbId, coll, [
    Query.equal("status", statusVal),
  ]);
  let maxOrder = -1;
  for (const d of existing.documents) {
    const o = (d as unknown as { order?: number }).order ?? 0;
    if (o > maxOrder) maxOrder = o;
  }
  const order = maxOrder + 1;

  const { databases } = getAppwriteAdmin();
  const doc = await databases.createDocument(dbId, coll, ID.unique(), {
    title,
    description: description ?? "",
    status: statusVal,
    assignee_id: assigneeId ?? "",
    urgency: urgency ?? "medium",
    due_date: dueDate ?? "",
    order,
  });
  return NextResponse.json(mapDocument(doc));
}
