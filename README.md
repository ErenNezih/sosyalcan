# Sosyalcan Komuta Merkezi

ERP/CRM operasyon paneli — Next.js 14 (App Router), PostgreSQL (Prisma), iron-session auth, karanlık tema.

## Tek Seferlik Kurulum (Windows)

### 1. Vercel Postgres veya Neon

**Vercel Postgres:**
1. Vercel Dashboard → Projeniz → **Storage** → **Create Database** → **Postgres**
2. Oluşturulunca **Connect** → **.env.local** sekmesinden `DATABASE_URL` kopyalayın

**Neon (alternatif):**
1. https://neon.tech → Sign up → Yeni proje
2. Dashboard → **Connection string** (URI) kopyalayın

### 2. .env.local Oluştur

PowerShell veya CMD ile proje kökünde:

```powershell
npm run env:create
```

Oluşan `.env.local` dosyasını açıp şunları doldurun:
- `DATABASE_URL` — Vercel/Neon connection string (localhost kullanmayın)
- `SESSION_PASSWORD` — En az 32 karakter (örn: `super-secret-key-en-az-32-karakter-123`)
- `SEED_USER_A_*` ve `SEED_USER_B_*` — Giriş için 2 kullanıcı

### 3. Migration ve Seed

```powershell
npm run db:migrate
npm run db:seed
```

### 4. Çalıştır

```powershell
npm run dev
```

Giriş: `SEED_USER_A_EMAIL` / `SEED_USER_A_PASS` (veya B)

---

## .env / .env.local Stratejisi

| Dosya       | Açıklama                          |
|-------------|------------------------------------|
| `.env.example` | Şablon (repo'da) — gerçek değer yok |
| `.env.local`   | Yerel ayarlar (gitignore) — DATABASE_URL burada |
| `.env`         | Opsiyonel — .env.local yoksa kullanılır |

Prisma komutları (`db:migrate`, `db:seed`) önce `.env.local` sonra `.env` okur.

---

## Vercel Deploy

1. GitHub → Vercel bağlayın
2. **Environment Variables** ekleyin:
   - `DATABASE_URL` (Vercel Postgres otomatik ekler veya Neon URL)
   - `SESSION_PASSWORD` (min 32 char)
   - `SEED_USER_A_EMAIL`, `SEED_USER_A_PASS`, `SEED_USER_A_NAME`
   - `SEED_USER_B_EMAIL`, `SEED_USER_B_PASS`, `SEED_USER_B_NAME`
3. Deploy
4. **İlk deploy sonrası** (yerelden Vercel DB ile):
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```

Sağlık kontrolü: `https://site.vercel.app/api/health/db`

---

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Production build |
| `npm run db:migrate` | Prisma migration (PostgreSQL) |
| `npm run db:seed` | 2 kullanıcı oluşturur |
| `npm run env:create` | .env.local şablon oluşturur |
| `npm run preflight` | Env ve şifre uzunluğu kontrolü |

---

## Mimari

- **Frontend:** Next.js 14 App Router, Tailwind, Radix UI
- **Backend:** Next.js API Routes, Prisma ORM
- **DB:** PostgreSQL (Vercel Postgres / Neon)
- **Auth:** iron-session (httpOnly cookie)
