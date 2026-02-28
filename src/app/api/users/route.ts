import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/auth/require-auth";

/**
 * GET /api/users - List users for assignee dropdown (id, name, email)
 */
export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json(users);
  } catch (e) {
    console.error("[api/users]", e);
    return NextResponse.json(apiError("SERVER_ERROR", "Kullanıcılar yüklenemedi"), { status: 500 });
  }
}
