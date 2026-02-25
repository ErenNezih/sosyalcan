import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { assignPackageSchema } from "@/lib/validations/customer";
import { auditLog } from "@/lib/audit";

const PACKAGE_AMOUNTS: Record<string, number> = {
  STARTER: 15_000,
  PRO: 22_500,
  PREMIUM: 50_000,
};

const dbId = APPWRITE.databaseId;
const collSubs = APPWRITE.collections.subscriptions;
const collAppointments = APPWRITE.collections.appointments;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;
  const body = await request.json();
  const parsed = assignPackageSchema.safeParse({ ...body, customerId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const amount = PACKAGE_AMOUNTS[parsed.data.packageType];
  const planNames: Record<string, string> = { STARTER: "Starter", PRO: "Pro", PREMIUM: "Premium" };
  const planName = planNames[parsed.data.packageType] ?? parsed.data.packageType;
  const startDate = new Date();
  const nextPaymentDate = new Date(startDate);
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  const { databases } = getAppwriteAdmin();
  const subscriptionDoc = await databases.createDocument(dbId, collSubs, ID.unique(), {
    customer_id: parsed.data.customerId,
    plan_name: planName,
    package_type: parsed.data.packageType,
    amount,
    start_date: startDate.toISOString(),
    next_payment_date: nextPaymentDate.toISOString(),
    status: "active",
    remaining_amount: "",
    remaining_due_date: "",
  });

  const customerDoc = await databases.getDocument(dbId, APPWRITE.collections.customers, parsed.data.customerId) as unknown as { name?: string };
  const customerName = customerDoc?.name ?? "Müşteri";
  const start = new Date(nextPaymentDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(nextPaymentDate);
  end.setHours(10, 0, 0, 0);

  await databases.createDocument(dbId, collAppointments, ID.unique(), {
    title: `${customerName} – ${planName} ödemesi (${amount.toLocaleString("tr-TR")} TL)`,
    start: start.toISOString(),
    end: end.toISOString(),
    type: "finance",
    related_id: subscriptionDoc.$id,
    related_type: "Subscription",
    user_id: session.$id,
    description: "",
  });

  await auditLog({
    userId: session.$id,
    action: "subscription.created",
    entityType: "Subscription",
    entityId: subscriptionDoc.$id,
    payload: { customerId: parsed.data.customerId, packageType: parsed.data.packageType, amount },
  });

  return NextResponse.json({
    id: subscriptionDoc.$id,
    customerId: parsed.data.customerId,
    planName,
    packageType: parsed.data.packageType,
    amount,
    startDate: startDate.toISOString(),
    nextPaymentDate: nextPaymentDate.toISOString(),
    status: "active",
  });
}
