# Sistem Check-up ve Onarım Raporu — Sosyalcan ERP/Finans

## Tespit Edilen Açıklar ve Uygulanan Düzeltmeler

---

### 1. Finansal Matematik ve Edge Case Açıkları

| Açık | Risk | Çözüm |
|------|------|--------|
| **Floating-point dağılım** | `(total * percentage) / 100` JavaScript sayıları ile kuruş kaybı / fazlası (örn. 22.500 × 0,15 = 3375.0000000000005). | `src/lib/finance.ts`: Kuruş bazlı dağılım (`splitAmountKurusSafe`). Toplam kuruş tamsayıda bölünüyor, son bucket’a kalan kuruş farkı verilerek toplam bire bir korunuyor. |
| **İşlem yarım kalması** | Transaction oluşup Balance güncellenmeden hata olursa veritabanı tutarsız kalıyordu. | Tüm finans yazma işlemleri `prisma.$transaction` içine alındı. Hata durumunda otomatik rollback. |
| **Try/catch yok** | Prisma hataları (P1001, unique constraint vb.) doğrudan 500 / beyaz ekrana gidiyordu. | Tüm ilgili API route’larda try/catch; bağlantı hataları 503 + “Veritabanına ulaşılamıyor…” mesajı. |

**Güncellenen dosyalar:**  
`src/app/api/transactions/route.ts`, `src/app/api/subscriptions/[id]/collect/route.ts`, `src/lib/finance.ts`, `src/lib/db-error.ts`.

---

### 2. Veritabanı İlişkileri ve Soft Delete

| Açık | Risk | Çözüm |
|------|------|--------|
| **Müşteri silinince finans geçmişi** | Customer silindiğinde Transaction’da `onDelete: SetNull` ile customerId null kalıyor (kayıt duruyor) ama istenen davranış: finans geçmişi hiç silinmesin, müşteri “silindi” olarak işaretlensin. | `Customer` modeline `deletedAt DateTime?` eklendi. Tüm müşteri listeleme sorguları `where: { deletedAt: null }`. Müşteri “silme” ileride soft delete (deletedAt = now()) olarak yapılacak; hard delete yok. |
| **Silinmiş müşteri abonelikleri** | Silinmiş müşteriye ait abonelikler listede görünmemeli. | `GET /api/subscriptions` ve finance listesi `customer: { deletedAt: null }` ile filtreleniyor. |
| **Bağlantı koptuğunda beyaz ekran** | P1001 vb. hatalar yakalanmıyordu. | `src/lib/db-error.ts`: `isPrismaConnectionError()`. Tüm finans ve ilgili GET route’larda catch; 503 + “Veritabanına ulaşılamıyor. Lütfen servisi kontrol edin…” dönülüyor, Sonner ile gösteriliyor. |

**Güncellenen dosyalar:**  
`prisma/schema.prisma` (Customer.deletedAt), `src/app/api/customers/route.ts`, `src/app/api/subscriptions/route.ts`, `src/app/api/balances/route.ts`.

---

### 3. State Yönetimi ve “Sıfır Yenileme”

| Açık | Risk | Çözüm |
|------|------|--------|
| **Abonelik listesi güncellenmiyor** | İşlem eklendikten (örn. kısmi ödeme) sonra vadeler listesi yenilenmeden kalıyordu. | `SubscriptionDueList`’e `refreshTrigger` prop’u eklendi. Finans sayfası form `onSuccess`’te `refreshTrigger` artırılıyor; liste tekrar fetch ediyor. |
| **Çift tıklama ile çift kayıt** | Kaydet’e çift tıklanınca iki istek gidebilirdi. | Zaten mevcut: `react-hook-form` `isSubmitting` ve buton `disabled={isSubmitting}` ile tek gönderim garanti. |

**Güncellenen dosyalar:**  
`src/components/finance/subscription-due-list.tsx`, `src/app/dashboard/finance/page.tsx`.

---

### 4. UI/UX ve Validasyon

| Açık | Risk | Çözüm |
|------|------|--------|
| **Tutar alanı: harf / NaN** | Kullanıcı harf girince `valueAsNumber` NaN oluyor; mesaj net değildi. | Zod: `amount` için `number` + “Geçerli bir sayı girin” + `refine` ile `Number.isFinite` / `!Number.isNaN`. Min 0,01; makul üst sınır (99.999.999,99). |
| **API hataları alert** | Hata mesajları bazen tarayıcı alert veya sadece konsolda kalıyordu. | Tüm ilgili yerlerde `toast.error()` (Sonner) kullanılıyor: form submit, loadBalances, SubscriptionDueList fetch. 503 mesajı da toast ile gösteriliyor. |

**Güncellenen dosyalar:**  
`src/lib/validations/finance.ts`, `src/app/dashboard/finance/page.tsx`, `src/components/finance/subscription-due-list.tsx`, `src/components/finance/transaction-form.tsx` (zaten toast kullanıyordu).

---

## Özet

- **Finansal bütünlük:** Kuruş-safe dağılım + tek Prisma transaction; hata durumunda rollback.
- **Veritabanı:** Bağlantı hatalarında 503 + anlamlı mesaj; müşteri soft delete ile finans geçmişi korunuyor.
- **State:** İşlem sonrası bakiye ve vade listesi anında güncelleniyor; çift gönderim engelli.
- **UX:** Zod ile tutar validasyonu, Sonner ile tutarlı hata bildirimi.

Migration: `Customer.deletedAt` eklendi. Proje kökünde:

```bash
npx prisma migrate dev --name customer_soft_delete
# veya
npx prisma db push
```

Sonrasında seed/mevcut veriler `deletedAt: null` ile uyumludur.
