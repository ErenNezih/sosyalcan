# Sosyalcan Komuta Merkezi - Mimari Dokümantasyonu (v0.2.0)

## 1. Genel Bakış
Bu proje, Next.js 14 App Router ve Appwrite Cloud üzerine kurulu bir ERP/CRM sistemidir. Veri tutarlılığı, güvenlik ve gerçek zamanlı özellikler ön plandadır.

## 2. Teknoloji Yığını
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Radix UI.
- **Backend**: Next.js API Routes (Serverless Functions).
- **Veritabanı**: Appwrite Databases (NoSQL/Document store).
- **Auth**: Appwrite Auth (Session Cookie).
- **Realtime**: Appwrite Realtime API.

## 3. Veri Modeli ve Akışlar

### 3.1 Finans Akışı
- **Gelir (Income)**: İşlem girildiğinde, `finance_settings` üzerinden oranlar alınır ve `splitAmountKurusSafe` fonksiyonu ile bucket'lara dağıtılır. `transaction_splits` ve `balances` güncellenir.
- **Gider (Expense)**: İşlem girildiğinde, seçilen bucket'tan (varsayılan GIDER) düşülür (negatif split).
- **Transfer**: İki bucket arasında bakiye transferi.
- **İade (Refund)**: Gelir veya gider işleminin tersi.

### 3.2 CRM Akışı
- **Lead**: Potansiyel müşteri.
- **Conversion**: Lead -> Customer dönüşümü idempotent bir API ile yapılır. `converted_customer_id` kontrolü ve locking mekanizması ile çift kayıt önlenir.
- **Customer**: Müşteri. `contact_logs` ile iletişim geçmişi tutulur.
- **Projects**: Müşteriye bağlı projeler.
- **Deliverables**: Projeye bağlı teslim kalemleri. Onay süreci (Client Review -> Approved) vardır.

### 3.3 Bildirim Sistemi
- **Realtime**: `NotificationRealtime` bileşeni Appwrite Realtime API'yi dinler ve anlık toast bildirimleri gösterir.
- **Kurallar (Cron)**: `/api/jobs/run-rules` endpoint'i periyodik olarak çalışır ve geciken görevler, ödemeler vb. için bildirim oluşturur.

## 4. Güvenlik

### 4.1 Kimlik Doğrulama
- Appwrite Session Cookie (`a_session_<PROJECT_ID>`) kullanılır.
- Middleware, `/dashboard` altındaki tüm rotaları korur.

### 4.2 Yetkilendirme (RBAC)
- `user_profiles` koleksiyonunda kullanıcı rolleri (`admin`, `staff`, `readonly`) tutulur.
- API route'larında `requireRole` fonksiyonu ile rol kontrolü yapılır.

### 4.3 CSRF Koruması
- `validateCSRF` fonksiyonu ile Origin/Referer ve `X-CSRF-Token` (Double Submit Cookie) kontrolü yapılır.

## 5. Dağıtım ve Migrasyon
- **Migration**: `scripts/migrate-appwrite.mjs` scripti, veritabanı şemasını (koleksiyonlar, alanlar) kod ile senkronize eder. Idempotent çalışır.
- **Preflight**: `scripts/preflight.mjs` scripti, dağıtım öncesi ortam değişkenlerini ve veritabanı bağlantısını doğrular.
