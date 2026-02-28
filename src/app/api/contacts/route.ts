import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const contactLogSchema = z.object({
  customerId: z.string().min(1, "Müşteri ID zorunludur"),
  channel: z.enum(["phone", "whatsapp", "email", "meeting", "instagram", "other"]),
  summary: z.string().min(1, "Özet zorunludur"),
  nextFollowUpAt: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const archived = searchParams.get("archived");
    const limit = parseInt(searchParams.get("limit") || "50");

    const { databases } = getAppwriteAdmin();
    const queries = [Query.orderDesc("created_at"), Query.limit(limit)];
    if (archived === "true") queries.push(Query.equal("is_deleted", true));
    else if (archived !== "all") queries.push(Query.notEqual("is_deleted", true));
    if (customerId) queries.push(Query.equal("customer_id", customerId));

    const res = await databases.listDocuments(
      APPWRITE.databaseId, 
      APPWRITE.collections.contactLogs, 
      queries
    );
    
    return NextResponse.json({
      total: res.total,
      documents: res.documents.map((doc: any) => ({
        id: doc.$id,
        ...doc,
        customerId: doc.customer_id,
        nextFollowUpAt: doc.next_follow_up_at,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        createdBy: doc.created_by,
      })),
    });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }
}

export async function POST(request: Request) {
  const { authorized, user } = await requireRole(request, ["admin", "staff"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const result = contactLogSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { customerId, channel, summary, nextFollowUpAt } = result.data;

  const { databases } = getAppwriteAdmin();

  try {
    const doc = await databases.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.contactLogs,
      ID.unique(),
      {
        customer_id: customerId,
        channel,
        summary,
        next_follow_up_at: nextFollowUpAt || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.$id,
      }
    ) as any;

    // Update Customer's last contact info? 
    // Maybe not necessary if we query logs, but good for quick access.
    // But schema doesn't have last_contact_at.
    // Let's stick to querying logs.

    await auditLog({
      userId: user.$id,
      action: "contact.log",
      entityType: "ContactLog",
      entityId: doc.$id,
      payload: { customerId, channel },
    });

    return NextResponse.json({
      id: doc.$id,
      ...doc,
      customerId: doc.customer_id,
      nextFollowUpAt: doc.next_follow_up_at,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      createdBy: doc.created_by,
    });

  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "İletişim kaydı oluşturulamadı" }, { status: 500 });
  }
}
