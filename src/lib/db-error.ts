/**
 * Appwrite / ağ hata kontrolü.
 */
export function isAppwriteConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network|fetch failed|502|503/i.test(msg);
}

export const DB_UNREACHABLE_MESSAGE =
  "Servise ulaşılamıyor. Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.";

/** Eski Prisma kullanımı için alias (geçiş sürecinde import'ları kırmamak için). */
export const isPrismaConnectionError = isAppwriteConnectionError;
