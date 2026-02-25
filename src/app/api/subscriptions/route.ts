import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.subscriptions;

function getDueStatus(nextPaymentDate: string): "yaklasıyor" | "odeme_gunu" | "gecikti" | "ok" {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(nextPaymentDate);
  due.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (days < 0) return "gecikti";
  if (days === 0) return "odeme_gunu";
  if (days <= 3) return "yaklasıyor";
  return "ok";
}

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming");
  const finance = searchParams.get("finance");

  try {
    const { databases } = getAppwriteAdmin();
    const queries = [Query.equal("status", "active"), Query.orderAsc("next_payment_date")];
    if (upcoming) {
      const now = new Date().toISOString();
      const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      queries.push(Query.greaterThanEqual("next_payment_date", now));
      queries.push(Query.lessThanEqual("next_payment_date", weekLater));
    }

    const res = await databases.listDocuments(dbId, coll, queries);
    const list = mapDocumentList(res);

    if (finance) {
      const withStatus = list.map((s) => ({
        ...s,
        dueStatus: getDueStatus(
          (s as unknown as { remaining_amount?: string; remaining_due_date?: string; next_payment_date: string }).remaining_amount &&
          Number((s as unknown as { remaining_amount?: string }).remaining_amount) > 0 &&
          (s as unknown as { remaining_due_date?: string }).remaining_due_date
            ? (s as unknown as { remaining_due_date: string }).remaining_due_date
            : (s as unknown as { next_payment_date: string }).next_payment_date
        ),
      }));
      return NextResponse.json(withStatus);
    }
    return NextResponse.json(list);
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }
}
