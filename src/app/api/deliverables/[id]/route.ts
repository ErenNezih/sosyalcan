import { NextResponse } from "next/server";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const deliverableUpdateSchema = z.object({
  type: z.enum(["logo", "web", "reels", "seo", "ads", "branding", "other"]).optional(),
  title: z.string().optional(),
  status: z.enum(["todo", "in_progress", "client_review", "revision", "approved", "delivered", "archived"]).optional(),
  revisionCount: z.number().int().nonnegative().optional(),
  approvalRequired: z.boolean().optional(),
  approvedAt: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();

  try {
    const doc = await databases.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.deliverables,
      id
    ) as any;

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
      archivedAt: doc.archived_at,
    });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, user } = await requireRole(request, ["admin", "staff"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const result = deliverableUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();

  try {
    // Fetch existing doc to check status change
    const existingDoc = await databases.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.deliverables,
      id
    ) as any;

    const updates: Record<string, unknown> = {
      ...result.data,
      revision_count: result.data.revisionCount,
      approval_required: result.data.approvalRequired,
      approved_at: result.data.approvedAt,
      due_date: result.data.dueDate,
      updated_at: new Date().toISOString(),
    };

    // Auto-increment revision count if status changed to 'revision'
    if (result.data.status === "revision" && existingDoc.status !== "revision") {
      updates.revision_count = (existingDoc.revision_count || 0) + 1;
    }

    // Auto-set approved_at if status changed to 'approved'
    if (result.data.status === "approved" && existingDoc.status !== "approved") {
      updates.approved_at = new Date().toISOString();
    }

    const updatedDoc = await databases.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.deliverables,
      id,
      updates
    ) as any;

    await auditLog({
      userId: user.$id,
      action: "deliverable.update",
      entityType: "Deliverable",
      entityId: id,
      payload: result.data,
    });

    return NextResponse.json({
      id: updatedDoc.$id,
      ...updatedDoc,
      projectId: updatedDoc.project_id,
      revisionCount: updatedDoc.revision_count,
      approvalRequired: updatedDoc.approval_required,
      approvedAt: updatedDoc.approved_at,
      dueDate: updatedDoc.due_date,
      createdAt: updatedDoc.created_at,
      updatedAt: updatedDoc.updated_at,
      createdBy: updatedDoc.created_by,
    });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, user } = await requireRole(request, ["admin"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();

  try {
    // Soft delete (archive)
    await databases.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.deliverables,
      id,
      {
        status: "archived",
        archived_at: new Date().toISOString(),
        is_deleted: true,
      }
    );

    await auditLog({
      userId: user.$id,
      action: "deliverable.archive",
      entityType: "Deliverable",
      entityId: id,
      payload: { status: "archived" },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to archive deliverable" }, { status: 500 });
  }
}
