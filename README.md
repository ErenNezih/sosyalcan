# Sosyalcan Komuta Merkezi

ERP/CRM operasyon paneli — Next.js 14 (App Router), Prisma, NextAuth, karanlık tema, cam efektli slide-over formlar.

**Projeyi A'dan Z'ye anlatan detaylı doküman:** [docs/PROJE_ANLATIMI.md](docs/PROJE_ANLATIMI.md) (teknik yapı, veritabanı, API, güvenlik, modüller).

## Kurulum

1. Bağımlılıklar: `npm install`
2. `.env` oluştur (`.env.example` örnek):
   - `DATABASE_URL` — PostgreSQL bağlantı dizesi
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32` ile üret
   - `NEXTAUTH_URL` — `http://localhost:3000` (dev)
3. PostgreSQL: Yerelde çalışan bir PostgreSQL gerekir (örn. `localhost:5432`). Yoksa [Neon](https://neon.tech) veya [Supabase](https://supabase.com) gibi ücretsiz cloud PostgreSQL kullanın; bağlantı dizesini `.env` içindeki `DATABASE_URL` olarak ayarlayın.
4. Appwrite veritabanı: `.env` içinde `APPWRITE_API_KEY` tanımlı olmalı (Proje → API Keys → Create). Sonra:
   ```bash
   node setup-appwrite.mjs
   ```
   Bu betik tüm koleksiyonları ve attribute'ları (snake_case) oluşturur. Detay için dosya başındaki yorumlara bakın.
5. Geliştirme: `npm run dev`

## Özellikler

- **Kokpit**: Aylık net ciro, yeni potansiyeller, bugünün randevuları, aktif abonelikler; vitrin etkileşimleri tablosu
- **Müşteriler & CRM**: Leads (slide-over detay, "Müşteriye Çevir"); Aktif müşteriler (Starter/Pro/Premium paket atama)
- **Takvim**: Tek takvim (CRM, To-Do, Finans randevuları); slide-over ile ekleme/düzenleme
- **To-Do**: Kanban (Bekleyen → Kurguda → Revizede → Tamamlandı), sürükle-bırak, atanan ve aciliyet
- **Finans**: Gelir/Gider; net ciro sabit dağılım (30/30/15/15/10); Donut chart; abonelik ödeme uyarısı
- **Blog & SEO CMS**: Rich text, kapak, meta başlık/açıklama (160 karakter)
- **Ayarlar**: Audit log, bildirim tercihleri

## Güvenlik

- Kayıt sayfası yok; sadece veritabanında `SUPER_ADMIN` rolüne sahip kullanıcılar giriş yapabilir.
- `NODE_ENV=development` ve localhost’ta giriş bypass (DX); production’da NextAuth middleware tüm `/dashboard` rotalarını korur.

## Teknolojiler

Next.js 14, Tailwind CSS, Framer Motion, Prisma, PostgreSQL, NextAuth.js, Zustand, Lucide, Radix UI, Zod, React Hook Form, Sonner, Tiptap, @dnd-kit, Recharts.
