import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocumentList, Query } from "@/lib/appwrite/helpers";

const dbId = APPWRITE.databaseId;
const coll = APPWRITE.collections.posts;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archived = new URL(request.url).searchParams.get("archived");
  const queries = [Query.orderDesc("$createdAt")];
  if (archived === "true") queries.push(Query.equal("is_deleted", true));
  else if (archived !== "all") queries.push(Query.notEqual("is_deleted", true));

  const { databases } = getAppwriteAdmin();
  const res = await databases.listDocuments(dbId, coll, queries);
  return NextResponse.json(mapDocumentList(res));
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as Record<string, unknown>;
  const { title, slug, content, coverImageUrl, metaTitle, metaDescription, publishedAt } = body;
  if (!title || !slug) return NextResponse.json({ error: "title and slug required" }, { status: 400 });
  if (metaDescription && String(metaDescription).length > 160) {
    return NextResponse.json({ error: "metaDescription max 160 karakter" }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const doc = await databases.createDocument(dbId, coll, ID.unique(), {
    title: String(title),
    slug: String(slug).replace(/\s+/g, "-").toLowerCase(),
    content: content != null ? String(content) : "",
    cover_image_url: coverImageUrl != null ? String(coverImageUrl) : "",
    meta_title: metaTitle != null ? String(metaTitle) : "",
    meta_description: metaDescription != null ? String(metaDescription) : "",
    published_at: publishedAt != null ? String(publishedAt) : "",
    author_id: session.$id,
  });
  return NextResponse.json({
    id: doc.$id,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
    title: (doc as unknown as { title: string }).title,
    slug: (doc as unknown as { slug: string }).slug,
    content: (doc as unknown as { content: string }).content,
    coverImageUrl: (doc as unknown as { cover_image_url: string }).cover_image_url || null,
    metaTitle: (doc as unknown as { meta_title: string }).meta_title || null,
    metaDescription: (doc as unknown as { meta_description: string }).meta_description || null,
    publishedAt: (doc as unknown as { published_at: string }).published_at || null,
    authorId: (doc as unknown as { author_id: string }).author_id,
  });
}
