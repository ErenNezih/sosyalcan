/**
 * Appwrite Server SDK — API routes ve Server Components.
 * API key ile admin işlemleri; session cookie ile "mevcut kullanıcı" doğrulama.
 */

import { Client, Databases, Storage, Users } from "node-appwrite";
import { APPWRITE } from "./constants";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

function getAdminClient(): Client {
  const client = new Client();
  if (endpoint) client.setEndpoint(endpoint);
  if (projectId) client.setProject(projectId);
  if (apiKey) client.setKey(apiKey);
  return client;
}

/** Admin client — veritabanı/storage/users (API key). Her request için yeni instance kullanın. */
export function getAppwriteAdmin(): {
  client: Client;
  databases: Databases;
  storage: Storage;
  users: Users;
} {
  const client = getAdminClient();
  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
  };
}

/** Appwrite session cookie adı (Edge middleware ve server'da kullanılır). */
export function getAppwriteSessionCookieName(): string {
  const id = projectId ?? "";
  return `a_session_${id}`.toLowerCase();
}

export interface AppwriteUser {
  $id: string;
  email: string;
  name?: string;
  emailVerification: boolean;
}

/**
 * Request'ten session cookie'yi okuyup mevcut kullanıcıyı döner.
 * Cookie yoksa veya geçersizse null. API route'larda kullanın.
 */
export async function getSessionFromRequest(request: Request): Promise<AppwriteUser | null> {
  const cookieName = getAppwriteSessionCookieName();
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${escapeRegExp(cookieName)}=([^;]+)`));
  const sessionValue = match?.[1]?.trim();
  if (!sessionValue) return null;

  return getSessionFromSessionValue(sessionValue);
}

/**
 * Next.js cookies() (Server Component / layout) ile session. Cookie store'dan değer alıp doğrular.
 * Çerez yoksa veya value boşsa null; SSR çökmesini önlemek için güvenli okuma.
 */
export async function getSessionFromCookieStore(
  getCookie: (name: string) => { value?: string } | undefined
): Promise<AppwriteUser | null> {
  const cookieName = getAppwriteSessionCookieName();
  const cookie = getCookie(cookieName);
  if (!cookie || typeof cookie.value !== "string") return null;
  const sessionValue = cookie.value.trim();
  if (!sessionValue) return null;
  return getSessionFromSessionValue(sessionValue);
}

async function getSessionFromSessionValue(sessionValue: string): Promise<AppwriteUser | null> {
  if (!endpoint || !projectId) return null;
  const url = `${endpoint.replace(/\/$/, "")}/account`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "X-Appwrite-Project": projectId,
        Cookie: `${getAppwriteSessionCookieName()}=${sessionValue}`,
      },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { $id: string; email: string; name?: string; emailVerification?: boolean };
    return {
      $id: user.$id,
      email: user.email,
      name: user.name ?? undefined,
      emailVerification: user.emailVerification ?? false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR getSessionFromSessionValue:", error);
    }
    return null;
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { APPWRITE };
