import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const deliverableSchema = z.object({
  projectId: z.string().min(1, "Proje ID zorunludur"),
  type: z.enum(["logo", "web", "reels", "seo", "ads", "branding", "other"]),
  title: z.string().min(1, "Başlık zorunludur"),
  status: z.enum(["todo", "in_progress", "client_review", "revision", "approved", "delivered", "archived"]).default("todo"),
  revisionCount: z.number().int().nonnegative().default(0),
  approvalRequired: z.boolean().default(false),
  approvedAt: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const archived = searchParams.get("archived");
    const limit = parseInt(searchParams.get("limit") || "50");

    const { databases } = getAppwriteAdmin();
    const queries = [Query.orderDesc("created_at"), Query.limit(limit)];
    
    if (archived === "true") queries.push(Query.equal("is_deleted", true));
    else if (archived !== "all") queries.push(Query.notEqual("is_deleted", true));
    if (projectId) queries.push(Query.equal("project_id", projectId));
    if (status) queries.push(Query.equal("status", status));

    const res = await databases.listDocuments(
      APPWRITE.databaseId, 
      APPWRITE.collections.deliverables, 
      queries
    );
    
    return NextResponse.json({
      total: res.total,
      documents: res.documents.map((doc: any) => ({
        id: doc.$id,
        ...doc,
        projectId: doc.project_id,
        revisionCount: doc.revision_count,
        approvalRequired: doc.approval_required,
        approvedAt: doc.approved_at,
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

  const result = deliverableSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { projectId, type, title, status, revisionCount, approvalRequired, approvedAt, dueDate, notes } = result.data;

  const { databases } = getAppwriteAdmin();

  try {
    const doc = await databases.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.deliverables,
      ID.unique(),
      {
        project_id: projectId,
        type,
        title,
        status,
        revision_count: revisionCount,
        approval_required: approvalRequired,
        approved_at: approvedAt || null,
        due_date: dueDate || null,
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
      action: "deliverable.create",
      entityType: "Deliverable",
      entityId: doc.$id,
      payload: { projectId, type, title, status },
    });

    return NextResponse.json({
      id: doc.$id,
      ...doc,
      projectId: doc.project_id,
      revisionCount: doc.revision_count,
      approvalRequired: doc.approval_required,
      approvedAt: doc.approved_at,
      dueDate: doc.due_date,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      createdBy: doc.created_by,
    });

  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "Teslim kalemi oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
