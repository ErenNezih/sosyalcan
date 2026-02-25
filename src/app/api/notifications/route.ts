import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.notifications;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = new URL(request.url).searchParams.get("since");

  const { databases } = getAppwriteAdmin();
  const queries = [Query.orderDesc("$createdAt"), Query.limit(20)];
  if (since) queries.push(Query.greaterThan("$createdAt", since));

  const res = await databases.listDocuments(dbId, coll, queries);
  const filtered = res.documents.filter((d) => {
    const uid = (d as unknown as { user_id?: string }).user_id;
    return uid == null || uid === "" || uid === session.$id;
  });
  return NextResponse.json(mapDocumentList({ ...res, documents: filtered }));
}
