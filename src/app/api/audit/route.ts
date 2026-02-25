import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.auditLogs;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 50, 100);

  const { databases } = getAppwriteAdmin();
  const res = await databases.listDocuments(dbId, coll, [
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
  ]);
  return NextResponse.json(mapDocumentList(res));
}
