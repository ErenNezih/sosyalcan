# Veritabanı Kurulumu

`npx prisma db push` ve `npm run db:seed` çalışması için PostgreSQL gerekir. Üç yol:

---

## Seçenek 1: Docker ile PostgreSQL (Önerilen – tek komut)

1. **Docker Desktop** kurulu olmalı: https://www.docker.com/products/docker-desktop/
2. Proje kökünde:
   ```bash
   docker-compose up -d
   ```
3. Birkaç saniye bekleyin, sonra:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
4. `.env` zaten `postgres:postgres@localhost:5432/sosyalcan` ile ayarlı; ek bir işlem gerekmez.

Durdurmak için: `docker-compose down`

---

## Seçenek 2: Ücretsiz Cloud PostgreSQL (Docker yoksa)

1. **Neon** (önerilen): https://neon.tech → Sign up → Yeni proje oluştur.
2. Dashboard’da **Connection string** kopyalayın (ör. `postgresql://kullanici:sifre@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).
3. Proje kökündeki **`.env`** dosyasında `DATABASE_URL` satırını bu bağlantı dizesiyle değiştirin:
   ```env
   DATABASE_URL="postgresql://kullanici:sifre@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
4. Terminalde:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

**Alternatif:** https://supabase.com → New project → Settings → Database → Connection string (URI) kopyalayıp `.env` içindeki `DATABASE_URL` yapın.

---

## Seçenek 3: Windows’ta Yerel PostgreSQL

1. **İndir:** https://www.postgresql.org/download/windows/ (veya https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
2. Kurulumda **port 5432** ve bir **şifre** belirleyin (örn. `postgres` kullanıcısı için).
3. Kurulum sonunda **Stack Builder**’ı atlayabilirsiniz.
4. **Servisi başlatın:**
   - `Win + R` → `services.msc` → Enter
   - Listede **postgresql-x64-16** (veya kurduğunuz sürüm) bulun → Sağ tık → **Start**
   - Veya PowerShell (Yönetici): `Start-Service postgresql-x64-16`
5. **`.env`** içinde kullanıcı/şifre/port’u kendi kurulumunuza göre ayarlayın:
   ```env
   DATABASE_URL="postgresql://postgres:SIZIN_SIFRENIZ@localhost:5432/sosyalcan?schema=public"
   ```
6. Önce veritabanını oluşturun (pgAdmin veya `psql` ile):
   - pgAdmin: Serverse sağ tık → Create → Database → Name: `sosyalcan`
   - veya komut satırı: `psql -U postgres -c "CREATE DATABASE sosyalcan;"`
7. Sonra proje kökünde:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

---

Özet: **Docker** kullanıyorsanız `docker-compose up -d` sonra `npx prisma db push` ve `npm run db:seed`. **Cloud** kullanıyorsanız `.env` içindeki `DATABASE_URL`’i yapıştırıp aynı iki komutu çalıştırın. **Yerel** kurulumda PostgreSQL’i kurup servisi başlattıktan ve `sosyalcan` veritabanını oluşturduktan sonra aynı komutları çalıştırın.
