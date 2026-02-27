import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getAppwriteAdmin } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { getSessionWithRole } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/rbac";
import { z } from "zod";

const settingsSchema = z.object({
  bucketOwnerUserId1: z.string().optional().nullable(),
  bucketOwnerUserId2: z.string().optional().nullable(),
  bucketLabels: z.string().optional().nullable(), // JSON string
  defaultBucketRatios: z.string().optional().nullable(), // JSON string
});

export async function GET(request: Request) {
  const session = await getSessionWithRole(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { databases } = getAppwriteAdmin();
  
  try {
    const response = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.financeSettings,
      [Query.limit(1)]
    );

    if (response.documents.length === 0) {
      // Return empty/default settings if not found
      return NextResponse.json({
        bucketOwnerUserId1: null,
        bucketOwnerUserId2: null,
        bucketLabels: null,
        defaultBucketRatios: null,
      });
    }

    const doc = response.documents[0] as any;
    return NextResponse.json({
      id: doc.$id,
      bucketOwnerUserId1: doc.bucket_owner_user_id_1,
      bucketOwnerUserId2: doc.bucket_owner_user_id_2,
      bucketLabels: doc.bucket_labels,
      defaultBucketRatios: doc.default_bucket_ratios,
    });
  } catch (error) {
    console.error("Error fetching finance settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { authorized, role } = await requireRole(request, ["admin"]);
  if (!authorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = settingsSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation error", details: result.error.format() }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const data = {
    bucket_owner_user_id_1: result.data.bucketOwnerUserId1,
    bucket_owner_user_id_2: result.data.bucketOwnerUserId2,
    bucket_labels: result.data.bucketLabels,
    default_bucket_ratios: result.data.defaultBucketRatios,
    updated_at: new Date().toISOString(),
  };

  try {
    const response = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.financeSettings,
      [Query.limit(1)]
    );

    if (response.documents.length === 0) {
      // Create new
      const doc = await databases.createDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.financeSettings,
        ID.unique(),
        {
          ...data,
          created_at: new Date().toISOString(),
          created_by: (await getSessionWithRole(request))?.$id,
        }
      );
      return NextResponse.json(doc);
    } else {
      // Update existing
      const doc = await databases.updateDocument(
        APPWRITE.databaseId,
        APPWRITE.collections.financeSettings,
        response.documents[0].$id,
        data
      );
      return NextResponse.json(doc);
    }
  } catch (error) {
    console.error("Error saving finance settings:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
