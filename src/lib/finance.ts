/**
 * Finansal dağılım: Kuruş bazlı hesaplama ile floating-point kaynaklı kuruş kaybı önlenir.
 * Toplam tutar son bucket'a kalan kuruş farkı eklenerek bire bir korunur.
 */

export type BalanceBucket = "EREN" | "KERIM" | "GIDER" | "BIRIKIM" | "ACIL_DURUM";

export interface BucketRatio {
  bucket: BalanceBucket;
  percentage: number;
}

export const DEFAULT_SPLIT_PERCENTAGES: BucketRatio[] = [
  { bucket: "EREN", percentage: 30 },
  { bucket: "KERIM", percentage: 30 },
  { bucket: "GIDER", percentage: 15 },
  { bucket: "BIRIKIM", percentage: 15 },
  { bucket: "ACIL_DURUM", percentage: 10 },
];

export interface SplitResult {
  bucket: BalanceBucket;
  percentage: number;
  amount: number;
}

/**
 * Tutarı yüzdelere göre kuruş-safe böl; son bucket'ta rounding farkı toplanır.
 * @param totalAmount İşlem tutarı (pozitif veya negatif olabilir)
 * @param ratios Opsiyonel oranlar (yoksa varsayılan kullanılır)
 */
export function splitAmountKurusSafe(
  totalAmount: number,
  ratios: BucketRatio[] = DEFAULT_SPLIT_PERCENTAGES
): SplitResult[] {
  // Kuruş bazında işlem yap (tam sayı)
  const totalKurus = Math.round(totalAmount * 100);
  
  // 0 ise boş dön
  if (totalKurus === 0) return [];

  const results: SplitResult[] = [];
  let assignedKurus = 0;

  // Oranların toplamı 100 olmalı mı? Kontrol edilebilir ama son bucket kalanı alacağı için şart değil.
  // Ancak mantıksal tutarlılık için 100 olması beklenir.

  for (let i = 0; i < ratios.length; i++) {
    const { bucket, percentage } = ratios[i];
    const isLast = i === ratios.length - 1;
    
    let bucketKurus: number;
    
    if (isLast) {
      // Son bucket kalan tüm kuruşları alır (rounding farkı dahil)
      bucketKurus = totalKurus - assignedKurus;
    } else {
      // Ara bucket'lar: (Tutar * Yüzde) / 100
      // Math.floor kullanarak aşağı yuvarla, artan son bucket'a gitsin.
      // Negatif sayılarda Math.floor davranışı farklıdır (-3.5 -> -4).
      // Bu yüzden mutlak değer üzerinden hesaplayıp işareti ekleyelim.
      const absTotal = Math.abs(totalKurus);
      const absShare = Math.floor((absTotal * percentage) / 100);
      bucketKurus = totalKurus < 0 ? -absShare : absShare;
    }

    assignedKurus += bucketKurus;
    
    results.push({
      bucket,
      percentage,
      amount: bucketKurus / 100, // Tekrar TL'ye çevir
    });
  }

  return results;
}

/**
 * Gider işlemi için tek bir bucket'tan düşüş (negatif split) oluşturur.
 */
export function calculateExpenseSplit(
  amount: number,
  bucket: BalanceBucket = "GIDER"
): SplitResult[] {
  // Gider pozitiftir, ancak bakiyeden düşmek için negatif split oluştururuz.
  // Eğer amount negatif gelirse (iade), pozitif olur.
  
  return [{
    bucket,
    percentage: 100,
    amount: -amount // İşaretin tersini al
  }];
}

/**
 * Transfer işlemi: Bir bucket'tan diğerine aktarım.
 * Kaynak bucket azalır (-), hedef bucket artar (+).
 */
export function calculateTransferSplit(
  amount: number,
  fromBucket: BalanceBucket,
  toBucket: BalanceBucket
): SplitResult[] {
  const absAmount = Math.abs(amount);
  
  return [
    {
      bucket: fromBucket,
      percentage: 0, // Transferde yüzde anlamsız
      amount: -absAmount // Kaynaktan düş
    },
    {
      bucket: toBucket,
      percentage: 0,
      amount: absAmount // Hedefe ekle
    }
  ];
}
