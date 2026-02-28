# Sosyalcan Komuta Merkezi v0.2.0

ERP/CRM operasyon paneli — Next.js 14 (App Router), Appwrite Cloud, karanlık tema, cam efektli slide-over formlar.

**Projeyi A'dan Z'ye anlatan detaylı doküman:** [docs/PROJE_KAPSAMLI_ANLATIM.md](docs/PROJE_KAPSAMLI_ANLATIM.md)

## Kurulum ve Dağıtım

### 1. Gereksinimler
- Node.js 18+
- Appwrite Cloud hesabı ve projesi

### 2. Yerel Kurulum
1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. `.env` dosyasını oluşturun (örnek `.env.example`):
   ```env
   NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
   APPWRITE_API_KEY=your_admin_api_key
   APP_ORIGIN=http://localhost:3000
   ```
3. Veritabanı kurulumu ve migrasyon:
   ```bash
   npm run migrate
   ```
   Bu komut `scripts/migrations` altındaki dosyaları çalıştırarak koleksiyonları ve alanları oluşturur.
4. Ön kontrol (Preflight Check):
   ```bash
   npm run preflight
   ```
   Kurulumun doğruluğunu kontrol eder.
5. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

### 3. Vercel Dağıtımı (Deploy)
1. GitHub reponuzu Vercel'e bağlayın.
2. Environment Variables ayarlarını yapın:
   - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
   - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
   - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
   - `APPWRITE_API_KEY`
   - `APP_ORIGIN` (örn: `https://sosyalcan.vercel.app`)
   - `CRON_SECRET` (Cron job güvenliği için rastgele bir string)
3. Deploy edin.
4. **ÖNEMLİ:** Deploy sonrası veritabanı migrasyonunu Production ortamı için çalıştırın. Bunu yerel makinenizden Production `.env` değerlerini kullanarak yapabilirsiniz veya Vercel Console'dan build command içine ekleyebilirsiniz (önerilmez, manuel kontrol daha güvenlidir).

### 4. Cron Job Ayarları
Vercel Cron kullanarak periyodik görevleri çalıştırın. `vercel.json` dosyası kök dizinde olmalıdır (yoksa oluşturun):
```json
{
  "crons": [
    {
      "path": "/api/jobs/run-rules",
      "schedule": "0 * * * *"
    }
  ]
}
```
Vercel projesinde Cron Jobs sekmesinden `CRON_SECRET` header'ını ayarlayın (Authorization: Bearer <SECRET>).

## Silme = Arşivleme (Soft Delete)

Tüm modüllerde "silme" işlemi **arşivleme** olarak çalışır. Kayıtlar kalıcı olarak silinmez; `archived_at`, `archived_by` ve `is_deleted` alanları ile işaretlenir.

- **Varsayılan listelerde** arşivli kayıtlar görünmez.
- **"Arşivdekileri göster"** toggle ile arşivli kayıtlar listelenebilir.
- **Geri Yükle** butonu ile arşivden çıkarılabilir.
- **Finans işlemleri** arşivlendiğinde bakiyeler otomatik geri alınır (reversal).

## Özellikler (v0.2.0)

- **Kokpit**: Özet metrikler ve uyarılar.
- **Müşteriler & CRM**: Lead yönetimi, Müşteriye çevirme (Idempotent), İletişim geçmişi.
- **Projeler & İşler**: Proje takibi, Teslim kalemleri (Deliverables), Onay süreçleri.
- **Finans**: Gelir/Gider yönetimi, Otomatik dağılım (Bucket sistemi), Ayarlanabilir oranlar.
- **Takvim & To-Do**: Entegre takvim ve Kanban panosu.
- **Güvenlik**: RBAC (Rol bazlı erişim), CSRF koruması, Güvenli API route'ları.
- **Bildirimler**: Appwrite Realtime ile anlık bildirimler.

## Mimari

- **Frontend**: Next.js 14 App Router, Tailwind CSS, Radix UI, Framer Motion.
- **Backend**: Next.js API Routes.
- **Veritabanı**: Appwrite Databases.
- **Auth**: Appwrite Auth (Email/Password).
- **Storage**: Appwrite Storage.

## Geliştirme Kuralları

- **Lint & Typecheck**: Commit öncesi `npm run lint` ve `npm run typecheck` çalıştırın.
- **Migration**: Veritabanı şeması değişiklikleri için `scripts/migrations` altına yeni bir `.mjs` dosyası ekleyin.
