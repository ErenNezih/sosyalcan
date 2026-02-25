/**
 * First-party session sync cookie: Middleware (Edge) Appwrite'ın 3. parti çerezini
 * göremediği için localStorage ↔ cookie uyumsuzluğunu gidermek amacıyla, giriş
 * başarılı olduktan sonra istemci tarafında set edilir. Middleware bu çereze bakarak
 * /dashboard erişimine izin verir.
 */

export const SESSION_SYNC_COOKIE_NAME = "sosyalcan_session_sync";
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

/** İstemci tarafında çağrılır: giriş başarılı sonrası birinci taraf çerezi set eder. */
export function setSessionSyncCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_SYNC_COOKIE_NAME}=true; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** İstemci tarafında çağrılır: çıkışta çerezi siler. */
export function clearSessionSyncCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_SYNC_COOKIE_NAME}=; path=/; max-age=0`;
}
