/**
 * API hata yanıtlarından kullanıcı dostu mesaj üretir.
 */

export function getApiErrorMessage(
  res: { ok: boolean; status: number },
  body: { error?: string; message?: string } | null,
  fallback: string
): string {
  if (res.status === 401) {
    return "Oturum doğrulanamadı. Lütfen çıkış yapıp tekrar giriş yapın.";
  }
  if (res.status === 403) {
    return "Yetkiniz yok.";
  }
  if (res.status >= 500) {
    return "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
  }
  const msg = typeof body?.error === "string" ? body.error : body?.message;
  return msg && typeof msg === "string" ? msg : fallback;
}
