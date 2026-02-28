/**
 * Veritabanı / ağ hata kontrolü (Prisma, API).
 */
export function isDbConnectionError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|network|fetch failed|502|503/i.test(msg);
}

export const DB_UNREACHABLE_MESSAGE =
  "Servise ulaşılamıyor. Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.";
