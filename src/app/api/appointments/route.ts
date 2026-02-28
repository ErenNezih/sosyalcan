import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { z } from "zod";

const appointmentSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  description: z.string().optional(),
  start: z.string().min(1, "Başlangıç zorunludur"),
  end: z.string().min(1, "Bitiş zorunludur"),
  type: z.string().min(1, "Tip zorunludur"),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.appointments;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const archived = searchParams.get("archived");
  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }

  const archiveFilter = archived === "true"
    ? [Query.equal("is_deleted", true)]
    : archived === "all"
      ? []
      : [Query.notEqual("is_deleted", true)];

  const { databases } = getAppwriteAdmin();
  const res = await databases.listDocuments(dbId, coll, [
    ...archiveFilter,
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

  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
  }

  const { title, description, start, end, type, relatedId, relatedType } = parsed.data;

  const { databases } = getAppwriteAdmin();
  const doc = await databases.createDocument(dbId, coll, ID.unique(), {
    title,
    description: description ?? "",
    start,
    end,
    type,
    related_id: relatedId ?? "",
    related_type: relatedType ?? "",
    user_id: session.$id,
  });
  return NextResponse.json(mapDocument(doc));
}
