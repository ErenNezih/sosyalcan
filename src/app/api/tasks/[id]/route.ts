import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument } from "@/lib/appwrite/helpers";
import { auditLog } from "@/lib/audit";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.tasks;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { databases, users } = getAppwriteAdmin();
  try {
    const doc = await databases.getDocument(dbId, coll, id);
    const mapped = mapDocument(doc);
    const assigneeId = doc.assignee_id as string | undefined;
    let assignee = null;
    if (assigneeId) {
      try {
        const u = await users.get(assigneeId);
        assignee = { id: u.$id, name: u.name ?? null, email: u.email };
      } catch {
        // user may be deleted
      }
    }
    return NextResponse.json({
      ...mapped,
      dueDate: mapped.due_date ?? null,
      assigneeId: mapped.assignee_id ?? null,
      assignee,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;

  const { databases } = getAppwriteAdmin();
  let prev: { status?: string; title?: string };
  try {
    prev = await databases.getDocument(dbId, coll, id) as unknown as { status?: string; title?: string };
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, string | number> = {};
  if (body.title != null) data.title = String(body.title);
  if (body.description != null) data.description = String(body.description);
  if (body.status != null) data.status = String(body.status);
  if (body.assigneeId != null) data.assignee_id = String(body.assigneeId);
  if (body.urgency != null) data.urgency = String(body.urgency);
  if (body.dueDate != null) data.due_date = body.dueDate ? String(body.dueDate) : "";
  if (body.order != null) data.order = Number(body.order);

  const doc = await databases.updateDocument(dbId, coll, id, data);

  if (body.status != null && body.status !== prev.status) {
    await auditLog({
      userId: session.$id,
      action: "task.status_changed",
      entityType: "Task",
      entityId: id,
      payload: { from: prev.status, to: body.status, title: (doc as unknown as { title?: string }).title },
    });
  }

  return NextResponse.json(mapDocument(doc));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(_request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();
  try {
    await databases.deleteDocument(dbId, coll, id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
