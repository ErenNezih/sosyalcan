import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";

const dbId = APPWRITE.databaseId;
const collCustomers = APPWRITE.collections.customers;
const collAppointments = APPWRITE.collections.appointments;

const CONTACT_YELLOW_DAYS = 20;
const CONTACT_RED_DAYS = 35;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const archived = new URL(request.url).searchParams.get("archived");
    const customerQueries = [Query.orderDesc("$createdAt")];
    if (archived === "true") customerQueries.push(Query.equal("is_deleted", true));
    else if (archived !== "all") {
      customerQueries.push(Query.notEqual("is_deleted", true));
      customerQueries.push(Query.isNull("deleted_at")); // legacy compat
    }

    const { databases } = getAppwriteAdmin();
    const customersRes = await databases.listDocuments(dbId, collCustomers, customerQueries);
    const customers = mapDocumentList(customersRes);

    const withContactStatus = new URL(request.url).searchParams.get("withContactStatus") === "1";
    if (!withContactStatus) return NextResponse.json(customers);

    const appointmentsRes = await databases.listDocuments(dbId, collAppointments, [
      Query.equal("related_type", "Customer"),
    ]);
    const lastByCustomer = new Map<string, string>();
    for (const a of appointmentsRes.documents) {
      const relId = (a as unknown as { related_id?: string }).related_id;
      const start = (a as unknown as { start?: string }).start;
      if (relId && start && !lastByCustomer.has(relId)) lastByCustomer.set(relId, start);
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const withStatus = customers.map((c) => {
      const last = lastByCustomer.get(c.id);
      const lastDate = last ? new Date(last) : null;
      const daysSince = lastDate
        ? Math.floor((now.getTime() - new Date(lastDate).setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000))
        : null;
      let pulse: "green" | "yellow" | "red" = "green";
      if (daysSince != null) {
        if (daysSince > CONTACT_RED_DAYS) pulse = "red";
        else if (daysSince > CONTACT_YELLOW_DAYS) pulse = "yellow";
      }
      return {
        ...c,
        lastContactAt: last ?? null,
        daysSinceContact: daysSince ?? null,
        contactPulse: pulse,
      };
    });

    return NextResponse.json(withStatus);
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }
}
