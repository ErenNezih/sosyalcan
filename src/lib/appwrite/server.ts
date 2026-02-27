/**
 * Appwrite Server SDK — API routes ve Server Components.
 * API key ile admin işlemleri; session cookie ile "mevcut kullanıcı" doğrulama.
 * JWT cookie (SC_JWT) first-party olduğu için production'da 3rd-party cookie sorununu çözer.
 */

import { Account, Client, Databases, Storage, Users } from "node-appwrite";
import { APPWRITE } from "./constants";
import { SC_JWT_COOKIE_NAME } from "@/lib/session-sync-cookie";

export { SC_JWT_COOKIE_NAME };

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

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`${escapeRegExp(name)}=([^;]+)`));
  return match?.[1]?.trim() ?? null;
}

/**
 * Request'ten session cookie veya JWT cookie okuyup mevcut kullanıcıyı döner.
 * Önce SC_JWT (first-party) dener; yoksa a_session_* (fallback). API route'larda kullanın.
 */
export async function getSessionFromRequest(request: Request): Promise<AppwriteUser | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const jwt = parseCookie(cookieHeader, SC_JWT_COOKIE_NAME);
  if (jwt) {
    const user = await getSessionFromJWT(jwt);
    if (user) return user;
  }

  const cookieName = getAppwriteSessionCookieName();
  const sessionValue = parseCookie(cookieHeader, cookieName);
  if (!sessionValue) return null;

  return getSessionFromSessionValue(sessionValue);
}

async function getSessionFromJWT(jwt: string): Promise<AppwriteUser | null> {
  if (!endpoint || !projectId) return null;
  try {
    const client = new Client();
    client.setEndpoint(endpoint);
    client.setProject(projectId);
    client.setJWT(jwt);
    const account = new Account(client);
    const user = await account.get();
    return {
      $id: user.$id,
      email: user.email,
      name: user.name ?? undefined,
      emailVerification: user.emailVerification ?? false,
    };
  } catch {
    return null;
  }
}

/**
 * Next.js cookies() (Server Component / layout) ile session. Cookie store'dan değer alıp doğrular.
 * Önce SC_JWT (first-party), yoksa a_session_* (fallback). SSR çökmesini önlemek için güvenli okuma.
 */
export async function getSessionFromCookieStore(
  getCookie: (name: string) => { value?: string } | undefined
): Promise<AppwriteUser | null> {
  const jwtCookie = getCookie(SC_JWT_COOKIE_NAME);
  if (jwtCookie?.value?.trim()) {
    const user = await getSessionFromJWT(jwtCookie.value.trim());
    if (user) return user;
  }

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
