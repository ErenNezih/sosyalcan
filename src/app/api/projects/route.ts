import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const projectSchema = z.object({
  name: z.string().min(1, "Proje adı zorunludur"),
  customerId: z.string().optional(),
  status: z.enum(["active", "on_hold", "done", "archived"]).default("active"),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.number().int().nonnegative().optional(), // Kurus
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const { databases } = getAppwriteAdmin();
    const queries = [Query.orderDesc("created_at"), Query.limit(limit)];
    
    if (customerId) queries.push(Query.equal("customer_id", customerId));
    if (status) queries.push(Query.equal("status", status));
    
    // Filter out deleted/archived unless explicitly asked?
    // Let's filter out deleted (is_deleted=true) by default if we implement soft delete.
    // The migration didn't add is_deleted to projects, but added archived_at.
    // Let's filter out archived if status != archived?
    // Or just return everything matching query.

    const res = await databases.listDocuments(
      APPWRITE.databaseId, 
      APPWRITE.collections.projects, 
      queries
    );
    
    return NextResponse.json({
      total: res.total,
      documents: res.documents.map((doc: any) => ({
        id: doc.$id,
        ...doc,
        // Map snake_case to camelCase for frontend convenience if needed
        customerId: doc.customer_id,
        startDate: doc.start_date,
        dueDate: doc.due_date,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
        createdBy: doc.created_by,
        archivedAt: doc.archived_at,
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

  const result = projectSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { name, customerId, status, startDate, dueDate, budget, priority, notes } = result.data;

  const { databases } = getAppwriteAdmin();

  try {
    const doc = await databases.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.projects,
      ID.unique(),
      {
        name,
        customer_id: customerId || null,
        status,
        start_date: startDate || null,
        due_date: dueDate || null,
        budget: budget || 0,
        priority,
        notes: notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user.$id,
        archived_at: null,
        is_deleted: false,
      }
    ) as any;

    await auditLog({
      userId: user.$id,
      action: "project.create",
      entityType: "Project",
      entityId: doc.$id,
      payload: { name, customerId, status },
    });

    return NextResponse.json({
      id: doc.$id,
      ...doc,
      customerId: doc.customer_id,
      startDate: doc.start_date,
      dueDate: doc.due_date,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      createdBy: doc.created_by,
    });

  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Proje oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
