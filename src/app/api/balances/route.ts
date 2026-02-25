import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList } from "@/lib/appwrite/helpers";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.balances;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { databases } = getAppwriteAdmin();
    const res = await databases.listDocuments(dbId, coll, []);
    return NextResponse.json(mapDocumentList(res));
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }
}
