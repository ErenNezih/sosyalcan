import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.appointments;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();
  try {
    const doc = await databases.getDocument(dbId, coll, id);
    return NextResponse.json(mapDocument(doc));
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
  const data: Record<string, string> = {};
  if (body.title != null) data.title = String(body.title);
  if (body.description != null) data.description = String(body.description);
  if (body.start != null) data.start = String(body.start);
  if (body.end != null) data.end = String(body.end);
  if (body.relatedId != null) data.related_id = String(body.relatedId);
  if (body.relatedType != null) data.related_type = String(body.relatedType);

  const { databases } = getAppwriteAdmin();
  try {
    const doc = await databases.updateDocument(dbId, coll, id, data);
    return NextResponse.json(mapDocument(doc));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
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
