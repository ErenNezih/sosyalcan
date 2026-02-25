/**
 * Appwrite Database ve Collection ID'leri.
 * Cloud Console'da oluşturduğunuz database/collection id'leri ile güncelleyin.
 */

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "sosyalcan_db";
const BUCKET_MEDIA_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_MEDIA_ID ?? "media";

export const APPWRITE = {
  databaseId: DB_ID,
  bucketMediaId: BUCKET_MEDIA_ID,
  collections: {
    leads: "leads",
    customers: "customers",
    subscriptions: "subscriptions",
    appointments: "appointments",
    tasks: "tasks",
    transactions: "transactions",
    transactionSplits: "transaction_splits",
    balances: "balances",
    posts: "posts",
    media: "media",
    auditLogs: "audit_logs",
    notifications: "notifications",
  },
} as const;

export type AppwriteCollectionId = (typeof APPWRITE.collections)[keyof typeof APPWRITE.collections];
