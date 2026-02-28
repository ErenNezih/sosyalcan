/**
 * Tarih standardı: ISO string (YYYY-MM-DD veya YYYY-MM-DDTHH:mm:ss.sssZ).
 * due_date / due_at: gün bazlı filtre için YYYY-MM-DD veya tam ISO kabul edilir.
 */
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";

/** Bugünün YYYY-MM-DD string'i */
export function todayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Verilen günün başlangıç ve bitiş ISO string'leri (gün bazlı filtre için) */
export function dayRangeISO(dayStr: string): { from: string; to: string } {
  const d = new Date(dayStr + "T12:00:00.000Z");
  return {
    from: startOfDay(d).toISOString(),
    to: endOfDay(d).toISOString(),
  };
}

/** Dün / Bugün / Yarın için YYYY-MM-DD */
export function relativeDay(offset: -1 | 0 | 1): string {
  const d = offset === 0 ? new Date() : offset === 1 ? addDays(new Date(), 1) : subDays(new Date(), 1);
  return format(d, "yyyy-MM-dd");
}
