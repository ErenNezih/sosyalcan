import { NextResponse } from "next/server";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const projectUpdateSchema = z.object({
  name: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(["active", "on_hold", "done", "archived"]).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  budget: z.number().int().nonnegative().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
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
      APPWRITE.collections.projects,
      id
    ) as any;

    return NextResponse.json({
      id: doc.$id,
      ...doc,
      customerId: doc.customer_id,
      startDate: doc.start_date,
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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

  const result = projectUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();

  try {
    const updatedDoc = await databases.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.projects,
      id,
      {
        ...result.data,
        customer_id: result.data.customerId,
        start_date: result.data.startDate,
        due_date: result.data.dueDate,
        updated_at: new Date().toISOString(),
      }
    ) as any;

    await auditLog({
      userId: user.$id,
      action: "project.update",
      entityType: "Project",
      entityId: id,
      payload: result.data,
    });

    return NextResponse.json({
      id: updatedDoc.$id,
      ...updatedDoc,
      customerId: updatedDoc.customer_id,
      startDate: updatedDoc.start_date,
      dueDate: updatedDoc.due_date,
      createdAt: updatedDoc.created_at,
      updatedAt: updatedDoc.updated_at,
      createdBy: updatedDoc.created_by,
    });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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
      APPWRITE.collections.projects,
      id,
      {
        status: "archived",
        archived_at: new Date().toISOString(),
        is_deleted: true,
      }
    );

    await auditLog({
      userId: user.$id,
      action: "project.archive",
      entityType: "Project",
      entityId: id,
      payload: { status: "archived" },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "Failed to archive project" }, { status: 500 });
  }
}
