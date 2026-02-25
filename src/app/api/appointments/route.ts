import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, mapDocumentList, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.appointments;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const res = await databases.listDocuments(dbId, coll, [
    Query.greaterThanEqual("start", from),
    Query.lessThanEqual("start", to),
    Query.orderAsc("start"),
  ]);
  const list = mapDocumentList(res);
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { title, description, start, end, type, relatedId, relatedType } = body;
  if (!title || !start || !end || !type) {
    return NextResponse.json({ error: "title, start, end, type required" }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const doc = await databases.createDocument(dbId, coll, ID.unique(), {
    title: String(title),
    description: description != null ? String(description) : "",
    start: String(start),
    end: String(end),
    type: String(type),
    related_id: relatedId != null ? String(relatedId) : "",
    related_type: relatedType != null ? String(relatedType) : "",
    user_id: session.$id,
  });
  return NextResponse.json(mapDocument(doc));
}
