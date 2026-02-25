import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin } from "@/lib/appwrite/server";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { users } = getAppwriteAdmin();
  const list = await users.list();
  const result = list.users.map((u) => ({
    id: u.$id,
    name: u.name ?? null,
    email: u.email,
  }));
  return NextResponse.json(result);
}
