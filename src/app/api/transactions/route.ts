import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { splitAmountKurusSafe } from "@/lib/finance";
import { auditLog } from "@/lib/audit";
import { isAppwriteConnectionError, DB_UNREACHABLE_MESSAGE } from "@/lib/db-error";

const dbId = APPWRITE.databaseId;
const collTx = APPWRITE.collections.transactions;
const collSplits = APPWRITE.collections.transactionSplits;
const collBalances = APPWRITE.collections.balances;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { databases } = getAppwriteAdmin();
    const queries = [Query.orderDesc("date"), Query.limit(100)];
    if (from) queries.push(Query.greaterThanEqual("date", from));
    if (to) queries.push(Query.lessThanEqual("date", to));

    const res = await databases.listDocuments(dbId, collTx, queries);
    return NextResponse.json(mapDocumentList(res));
  } catch (e) {
    if (isAppwriteConnectionError(e)) {
      return NextResponse.json({ error: DB_UNREACHABLE_MESSAGE }, { status: 503 });
    }
    throw e;
  }
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const type = body.type as "income" | "expense";
  const rawAmount = Number(body.amount);
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
    return NextResponse.json({ error: "Geçerli bir tutar girin (0'dan büyük)" }, { status: 400 });
  }
  const description = (body.description as string) ?? "";
  const date = body.date ? new Date(body.date as string) : new Date();
  const category = (body.category as string) ?? "";
  let customerId = (body.customerId as string) ?? "";
  const status = ((body.status as string) === "PENDING" || (body.status as string) === "OVERDUE")
    ? (body.status as "PENDING" | "OVERDUE")
    : "COMPLETED";
  const isPartialPayment = !!body.isPartialPayment;
  const subscriptionId = (body.subscriptionId as string) ?? "";
  const remainingDueDate = body.remainingDueDate ? new Date(body.remainingDueDate as string).toISOString() : "";
  const expenseTag = body.expenseTag === "PROJECT" ? "PROJECT" : body.expenseTag === "GENERAL" ? "GENERAL" : "";

  if (!type || (type !== "income" && type !== "expense")) {
    return NextResponse.json({ error: "Geçersiz işlem türü" }, { status: 400 });
  }

  if (type === "expense" && expenseTag === "PROJECT" && !customerId) {
    return NextResponse.json({ error: "Proje gideri için müşteri seçin" }, { status: 400 });
  }

  const { databases, users } = getAppwriteAdmin();
  let user1Id: string | null = null;
  let user2Id: string | null = null;
  try {
    const userList = await users.list();
    const list = userList.users.slice(0, 2);
    if (list.length > 0) user1Id = list[0].$id;
    if (list.length > 1) user2Id = list[1].$id;
  } catch {
    // ignore
  }

  try {
    const txDoc = await databases.createDocument(dbId, collTx, ID.unique(), {
      type,
      amount: rawAmount,
      description,
      date: date.toISOString(),
      category,
      customer_id: customerId,
      status,
      created_by: session.$id,
      subscription_id: subscriptionId,
      is_partial_payment: isPartialPayment,
      expense_tag: expenseTag,
    });

    if (type === "income") {
      const splits = splitAmountKurusSafe(rawAmount);
      for (const { bucket, percentage, amount: splitAmount } of splits) {
        await databases.createDocument(dbId, collSplits, ID.unique(), {
          transaction_id: txDoc.$id,
          bucket,
          percentage,
          amount: Number(splitAmount),
        });
        const userId = bucket === "EREN" ? user1Id : bucket === "KERIM" ? user2Id : null;
        const balanceQueries = [Query.equal("bucket", bucket)];
        if (userId) balanceQueries.push(Query.equal("user_id", userId));
        else balanceQueries.push(Query.isNull("user_id"));
        const existing = await databases.listDocuments(dbId, collBalances, balanceQueries);
        const amt = Number(splitAmount);
        if (existing.documents.length > 0) {
          const ex = existing.documents[0] as unknown as { $id: string; balance: number };
          await databases.updateDocument(dbId, collBalances, ex.$id, {
            balance: (ex.balance ?? 0) + amt,
          });
        } else {
          await databases.createDocument(dbId, collBalances, ID.unique(), {
            user_id: userId ?? "",
            bucket,
            balance: amt,
          });
        }
      }
    } else {
      const giderList = await databases.listDocuments(dbId, collBalances, [
        Query.isNull("user_id"),
        Query.equal("bucket", "GIDER"),
      ]);
      const amt = rawAmount;
      if (giderList.documents.length > 0) {
        const g = giderList.documents[0] as unknown as { $id: string; balance: number };
        await databases.updateDocument(dbId, collBalances, g.$id, {
          balance: (g.balance ?? 0) + amt,
        });
      } else {
        await databases.createDocument(dbId, collBalances, ID.unique(), {
          user_id: "",
          bucket: "GIDER",
          balance: amt,
        });
      }
    }

    await auditLog({
      userId: session.$id,
      action: type === "income" ? (isPartialPayment ? "transaction.partial_income" : "transaction.income") : "transaction.expense",
      entityType: "Transaction",
      entityId: txDoc.$id,
      payload: { type, amount: rawAmount, description, subscriptionId: subscriptionId || undefined },
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
