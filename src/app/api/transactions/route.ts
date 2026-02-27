import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { 
  splitAmountKurusSafe, 
  calculateExpenseSplit, 
  calculateTransferSplit, 
  DEFAULT_SPLIT_PERCENTAGES,
  BalanceBucket,
  BucketRatio
} from "@/lib/finance";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";
import { z } from "zod";
import { requireRole } from "@/lib/auth/rbac";

const transactionSchema = z.object({
  type: z.enum(["income", "expense", "refund", "transfer"]),
  amount: z.number().positive("Tutar pozitif olmalıdır"),
  description: z.string().optional(),
  date: z.string().optional(), // ISO string
  category: z.string().optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  subscriptionId: z.string().optional(),
  status: z.enum(["PENDING", "COMPLETED", "OVERDUE"]).default("COMPLETED"),
  isPartialPayment: z.boolean().optional(),
  expenseTag: z.enum(["GENERAL", "PROJECT"]).optional(),
  
  // For Expense / Expense Refund
  bucket: z.enum(["EREN", "KERIM", "GIDER", "BIRIKIM", "ACIL_DURUM"]).optional(),
  
  // For Transfer
  fromBucket: z.enum(["EREN", "KERIM", "GIDER", "BIRIKIM", "ACIL_DURUM"]).optional(),
  toBucket: z.enum(["EREN", "KERIM", "GIDER", "BIRIKIM", "ACIL_DURUM"]).optional(),
  
  // For Refund
  refundType: z.enum(["income_refund", "expense_refund"]).optional(), // income_refund = we pay client, expense_refund = vendor pays us
});

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = parseInt(searchParams.get("limit") || "100");

    const { databases } = getAppwriteAdmin();
    const queries = [Query.orderDesc("date"), Query.limit(limit)];
    if (from) queries.push(Query.greaterThanEqual("date", from));
    if (to) queries.push(Query.lessThanEqual("date", to));

    const res = await databases.listDocuments(
      APPWRITE.databaseId, 
      APPWRITE.collections.transactions, 
      queries
    );
    
    return NextResponse.json({
      total: res.total,
      documents: res.documents.map((doc) => ({
        id: doc.$id,
        ...doc,
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

  const result = transactionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { 
    type, amount, description, date, category, customerId, projectId, subscriptionId, 
    status, isPartialPayment, expenseTag, bucket, fromBucket, toBucket, refundType 
  } = result.data;

  // Validation logic
  if (type === "expense" && expenseTag === "PROJECT" && !customerId) {
    return NextResponse.json({ error: "Proje gideri için müşteri seçin" }, { status: 400 });
  }
  if (type === "transfer" && (!fromBucket || !toBucket)) {
    return NextResponse.json({ error: "Transfer için kaynak ve hedef bucket seçin" }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  
  // 1. Get Finance Settings
  let ratios: BucketRatio[] = DEFAULT_SPLIT_PERCENTAGES;
  let user1Id: string | null = null;
  let user2Id: string | null = null;

  try {
    const settingsRes = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.financeSettings,
      [Query.limit(1)]
    );
    if (settingsRes.documents.length > 0) {
      const settings = settingsRes.documents[0] as any;
      user1Id = settings.bucket_owner_user_id_1;
      user2Id = settings.bucket_owner_user_id_2;
      if (settings.default_bucket_ratios) {
        try {
          ratios = JSON.parse(settings.default_bucket_ratios);
        } catch {
          console.error("Failed to parse default_bucket_ratios");
        }
      }
    }
  } catch (e) {
    console.error("Failed to fetch finance settings, using defaults", e);
  }

  // 2. Calculate Splits
  let splits: { bucket: BalanceBucket; percentage: number; amount: number }[] = [];

  if (type === "income") {
    // Money IN -> Split according to ratios
    splits = splitAmountKurusSafe(amount, ratios);
  } else if (type === "expense") {
    // Money OUT -> Subtract from specific bucket (default GIDER)
    splits = calculateExpenseSplit(amount, (bucket as BalanceBucket) || "GIDER");
  } else if (type === "transfer") {
    // Move between buckets
    splits = calculateTransferSplit(amount, fromBucket as BalanceBucket, toBucket as BalanceBucket);
  } else if (type === "refund") {
    if (refundType === "expense_refund") {
      // Refund of expense -> Money IN to specific bucket
      // calculateExpenseSplit(-amount) returns positive amount
      splits = calculateExpenseSplit(-amount, (bucket as BalanceBucket) || "GIDER");
    } else {
      // Refund of income (default) -> Money OUT -> Reverse splits
      splits = splitAmountKurusSafe(-amount, ratios);
    }
  }

  try {
    // 3. Create Transaction
    const txDoc = await databases.createDocument(
      APPWRITE.databaseId,
      APPWRITE.collections.transactions,
      ID.unique(),
      {
        type,
        amount,
        description: description || "",
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        category: category || "",
        customer_id: customerId || null,
        // project_id: projectId || null, // Add project_id to schema if not exists
        status,
        created_by: user.$id,
        subscription_id: subscriptionId || null,
        is_partial_payment: isPartialPayment || false,
        expense_tag: expenseTag || null,
      }
    );

    // 4. Create Splits and Update Balances
    for (const split of splits) {
      await databases.createDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.transactionSplits,
        ID.unique(),
        {
          transaction_id: txDoc.$id,
          bucket: split.bucket,
          percentage: split.percentage,
          amount: split.amount,
        }
      );

      // Determine User ID for Balance
      let balanceUserId: string | null = null;
      if (split.bucket === "EREN") balanceUserId = user1Id;
      else if (split.bucket === "KERIM") balanceUserId = user2Id;
      
      // Update Balance
      const balanceQueries = [Query.equal("bucket", split.bucket)];
      if (balanceUserId) balanceQueries.push(Query.equal("user_id", balanceUserId));
      else balanceQueries.push(Query.isNull("user_id"));

      const balanceDocs = await databases.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.balances,
        balanceQueries
      );

      if (balanceDocs.documents.length > 0) {
        const balanceDoc = balanceDocs.documents[0] as any;
        await databases.updateDocument(
          APPWRITE.databaseId,
          APPWRITE.collections.balances,
          balanceDoc.$id,
          {
            balance: (balanceDoc.balance || 0) + split.amount,
          }
        );
      } else {
        await databases.createDocument(
          APPWRITE.databaseId,
          APPWRITE.collections.balances,
          ID.unique(),
          {
            user_id: balanceUserId,
            bucket: split.bucket,
            balance: split.amount,
          }
        );
      }
    }

    // 5. Audit Log
    await auditLog({
      userId: user.$id,
      action: `transaction.${type}`,
      entityType: "Transaction",
      entityId: txDoc.$id,
      payload: { 
        type, 
        amount, 
        description, 
        subscriptionId,
        splits: splits.map(s => ({ b: s.bucket, a: s.amount })) 
      },
    }).catch(() => {});

    return NextResponse.json({
      id: txDoc.$id,
      ...txDoc,
    });

  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    const message = e instanceof Error ? e.message : "İşlem kaydedilemedi";
    console.error("Transaction error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
