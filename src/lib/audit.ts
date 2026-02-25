import { ID } from "node-appwrite";
import { getAppwriteAdmin, APPWRITE } from "./appwrite/server";

export async function auditLog(params: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, unknown>;
}) {
  const { databases } = getAppwriteAdmin();
  const dbId = APPWRITE.databaseId;
  const collId = APPWRITE.collections.auditLogs;

  await databases.createDocument(dbId, collId, ID.unique(), {
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    payload: params.payload ? JSON.stringify(params.payload) : undefined,
  });
}
