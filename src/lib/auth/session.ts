import { getSessionFromRequest, getSessionFromCookieStore } from "@/lib/appwrite/server";
import { getUserRole, Role } from "./rbac";

export { getSessionFromRequest, getSessionFromCookieStore };

export async function getSessionWithRole(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  const role = await getUserRole(session.$id);
  return { ...session, role };
}

export async function getSessionWithRoleFromCookies(getCookie: (name: string) => { value?: string } | undefined) {
  const session = await getSessionFromCookieStore(getCookie);
  if (!session) return null;

  const role = await getUserRole(session.$id);
  return { ...session, role };
}
