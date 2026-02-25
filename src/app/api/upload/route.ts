import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { ID, InputFile } from "node-appwrite";

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const { storage } = getAppwriteAdmin();
  const bucketId = APPWRITE.bucketMediaId;

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const inputFile = InputFile.fromBuffer(buffer, file.name);
    const result = await storage.createFile(bucketId, ID.unique(), inputFile);
    const url = `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.replace("/v1", "")}/storage/v1/buckets/${bucketId}/files/${result.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
    return NextResponse.json({ url, key: result.$id });
  } catch (e) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
