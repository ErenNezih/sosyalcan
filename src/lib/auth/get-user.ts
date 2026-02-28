import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import type { SessionData } from "./session-config";
import { sessionOptions } from "./session-config";

/** Server component'larda mevcut kullanıcıyı al. Session yoksa null. */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session?.userId || !session.isLoggedIn) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });
  return user;
}
