# Veritabanı Kurulumu

PostgreSQL + Prisma. `npm run db:migrate` ve `npm run db:seed` için `.env.local` içinde `DATABASE_URL` gerekir.

---

## .env.local Oluşturma

**Yöntem 1 (Otomatik):**
```powershell
npm run env:create
```
Oluşan `.env.local` dosyasını düzenleyip `DATABASE_URL` ekleyin.

**Yöntem 2 (Manuel):** `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun.

---

## Seçenek 1: Vercel Postgres (Önerilen)

1. Vercel Dashboard → Proje → **Storage** → **Create Database** → **Postgres**
2. **Connect** → **.env.local** tab'ında `DATABASE_URL` görünür
3. Bu satırı proje kökündeki `.env.local` dosyasına yapıştırın
4. Komutlar:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

## Seçenek 2: Neon (Ücretsiz Cloud)

1. https://neon.tech → Sign up → Yeni proje
2. **Connection string** (URI) kopyalayın
3. `.env.local` içinde:
   ```env
   DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
4. Komutlar:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

## Seçenek 3: Docker (Yerel PostgreSQL)

1. `docker-compose up -d`
2. `.env.local` içinde:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sosyalcan?schema=public"
   ```
3. Komutlar:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

---

## Önemli Notlar

- **localhost kullanmayın** Vercel deploy için — P1001 hatası alırsınız
- `db:migrate` ve `db:seed` önce `.env.local` sonra `.env` okur
- Vercel'de Environment Variables ayarlayın; build sırasında migration otomatik çalışmaz, ilk deploy sonrası yerelden `npm run db:migrate` ve `npm run db:seed` çalıştırın
