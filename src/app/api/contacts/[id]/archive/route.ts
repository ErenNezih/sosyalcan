import { NextResponse } from "next/server";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { requireRole } from "@/lib/auth/rbac";
import { ARCHIVE_UPDATE } from "@/lib/archive";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, user } = await requireRole(request, ["admin", "staff"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();

  try {
    await databases.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.contactLogs,
      id,
      {
        archived_at: ARCHIVE_UPDATE.archived_at(),
        archived_by: ARCHIVE_UPDATE.archived_by(user.$id),
        is_deleted: ARCHIVE_UPDATE.is_deleted,
      }
    );

    await auditLog({
      userId: user.$id,
      action: "contact_log.archived",
      entityType: "ContactLog",
      entityId: id,
      payload: {},
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ error: "İletişim kaydı arşivlenemedi" }, { status: 500 });
  }
}
