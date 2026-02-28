import { NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { requireRole } from "@/lib/auth/rbac";
import { ARCHIVE_UPDATE } from "@/lib/archive";

/**
 * Archive transaction with balance REVERSAL (Option A).
 * Reverses each split: subtracts split.amount from the corresponding balance.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, user } = await requireRole(request, ["admin", "staff"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { databases } = getAppwriteAdmin();

  try {
    const txDoc = await databases.getDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.transactions,
      id
    ) as { $id: string; is_deleted?: boolean };

    if (txDoc.is_deleted) {
      return NextResponse.json({ error: "İşlem zaten arşivli" }, { status: 400 });
    }

    const splitsRes = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.transactionSplits,
      [Query.equal("transaction_id", id)]
    );

    let user1Id: string | null = null;
    let user2Id: string | null = null;
    try {
      const settingsRes = await databases.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.financeSettings,
        [Query.limit(1)]
      );
      if (settingsRes.documents.length > 0) {
        const s = settingsRes.documents[0] as { bucket_owner_user_id_1?: string; bucket_owner_user_id_2?: string };
        user1Id = s.bucket_owner_user_id_1 ?? null;
        user2Id = s.bucket_owner_user_id_2 ?? null;
      }
    } catch {
      // use defaults
    }

    for (const splitDoc of splitsRes.documents) {
      const split = splitDoc as unknown as { bucket: string; amount: number };
      const reverseAmount = -(split.amount);

      let balanceUserId: string | null = null;
      if (split.bucket === "EREN") balanceUserId = user1Id;
      else if (split.bucket === "KERIM") balanceUserId = user2Id;

      const balanceQueries = [Query.equal("bucket", split.bucket)];
      if (balanceUserId) balanceQueries.push(Query.equal("user_id", balanceUserId));
      else balanceQueries.push(Query.isNull("user_id"));

      const balanceDocs = await databases.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.balances,
        balanceQueries
      );

      if (balanceDocs.documents.length > 0) {
        const balanceDoc = balanceDocs.documents[0] as { $id: string; balance?: number };
        await databases.updateDocument(
          APPWRITE.databaseId,
          APPWRITE.collections.balances,
          balanceDoc.$id,
          { balance: (balanceDoc.balance || 0) + reverseAmount }
        );
      }
    }

    await databases.updateDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.transactions,
      id,
      {
        archived_at: ARCHIVE_UPDATE.archived_at(),
        archived_by: ARCHIVE_UPDATE.archived_by(user.$id),
        is_deleted: ARCHIVE_UPDATE.is_deleted,
      }
    );

    await auditLog({
      userId: user.$id,
      action: "transaction.voided",
      entityType: "Transaction",
      entityId: id,
      payload: { reversal: true },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "İşlem arşivlenemedi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
