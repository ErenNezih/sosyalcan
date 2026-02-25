import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.posts;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;
  if (body.metaDescription && String(body.metaDescription).length > 160) {
    return NextResponse.json({ error: "metaDescription max 160 karakter" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (body.title != null) data.title = String(body.title);
  if (body.slug != null) data.slug = String(body.slug).replace(/\s+/g, "-").toLowerCase();
  if (body.content != null) data.content = String(body.content);
  if (body.coverImageUrl != null) data.cover_image_url = String(body.coverImageUrl);
  if (body.metaTitle != null) data.meta_title = String(body.metaTitle);
  if (body.metaDescription != null) data.meta_description = String(body.metaDescription);
  if (body.publishedAt != null) data.published_at = body.publishedAt ? String(body.publishedAt) : "";

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
