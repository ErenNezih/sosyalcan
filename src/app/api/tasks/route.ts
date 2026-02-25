import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, mapDocumentList, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.tasks;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.url ? new URL(request.url) : null;
  const from = url?.searchParams.get("from");
  const to = url?.searchParams.get("to");

  const { databases } = getAppwriteAdmin();

  if (from && to) {
    const res = await databases.listDocuments(dbId, coll, [
      Query.greaterThanEqual("due_date", from),
      Query.lessThanEqual("due_date", to),
      Query.orderAsc("due_date"),
      Query.orderAsc("order"),
    ]);
    return NextResponse.json(mapDocumentList(res));
  }

  const res = await databases.listDocuments(dbId, coll, [
    Query.orderAsc("status"),
    Query.orderAsc("order"),
  ]);
  return NextResponse.json(mapDocumentList(res));
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { title, description, status, assigneeId, urgency, dueDate } = body;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const statusVal = (status as string) ?? "BEKLEYEN";
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
    title: String(title),
    description: description != null ? String(description) : "",
    status: statusVal,
    assignee_id: assigneeId != null ? String(assigneeId) : "",
    urgency: (urgency as string) ?? "medium",
    due_date: dueDate != null ? String(dueDate) : "",
    order,
  });
  return NextResponse.json(mapDocument(doc));
}
