import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { auditLog } from "@/lib/audit";

const dbId = APPWRITE.databaseId;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(_request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: subscriptionId } = await params;
  const { databases } = getAppwriteAdmin();

  let subscription: { $id: string; status: string; amount: number; remaining_amount?: string; customer_id: string; plan_name?: string; package_type: string; next_payment_date: string };
  try {
    const doc = await databases.getDocument(dbId, APPWRITE.collections.subscriptions, subscriptionId);
    subscription = doc as unknown as typeof subscription;
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }

  if (subscription.status !== "active") {
    return NextResponse.json({ error: "Abonelik bulunamadı veya aktif değil" }, { status: 404 });
  }

  const amount = subscription.remaining_amount && Number(subscription.remaining_amount) > 0
    ? Number(subscription.remaining_amount)
    : subscription.amount;

  const nextPaymentDate = new Date(subscription.next_payment_date);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  await databases.updateDocument(dbId, APPWRITE.collections.subscriptions, subscriptionId, {
    next_payment_date: nextPaymentDate.toISOString(),
    remaining_amount: "",
    remaining_due_date: "",
  });

  await auditLog({
    userId: session.$id,
    action: "subscription.collected",
    entityType: "Subscription",
    entityId: subscriptionId,
    payload: { amount, customerId: subscription.customer_id, nextPaymentDate: nextPaymentDate.toISOString() },
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
