/**
 * Finansal dağılım: Kuruş bazlı hesaplama ile floating-point kaynaklı kuruş kaybı önlenir.
 * Toplam tutar son bucket'a kalan kuruş farkı eklenerek bire bir korunur.
 */

export type BalanceBucket = "EREN" | "KERIM" | "GIDER" | "BIRIKIM" | "ACIL_DURUM";

export const SPLIT_PERCENTAGES: { bucket: BalanceBucket; percentage: number }[] = [
  { bucket: "EREN", percentage: 30 },
  { bucket: "KERIM", percentage: 30 },
  { bucket: "GIDER", percentage: 15 },
  { bucket: "BIRIKIM", percentage: 15 },
  { bucket: "ACIL_DURUM", percentage: 10 },
];

/**
 * Tutarı yüzdelere göre kuruş-safe böl; son bucket'ta rounding farkı toplanır.
 */
export function splitAmountKurusSafe(totalAmount: number): { bucket: BalanceBucket; percentage: number; amount: number }[] {
  const totalKurus = Math.round(totalAmount * 100);
  if (totalKurus <= 0) return [];

  const results: { bucket: BalanceBucket; percentage: number; amount: number }[] = [];
  let assignedKurus = 0;

  for (let i = 0; i < SPLIT_PERCENTAGES.length; i++) {
    const { bucket, percentage } = SPLIT_PERCENTAGES[i];
    const isLast = i === SPLIT_PERCENTAGES.length - 1;
    const bucketKurus = isLast
      ? totalKurus - assignedKurus
      : Math.floor((totalKurus * percentage) / 100);
    assignedKurus += bucketKurus;
    results.push({
      bucket,
      percentage,
      amount: bucketKurus / 100,
    });
  }
  return results;
}
