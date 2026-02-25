# Neon ile 2 Dakikada Veritabanı (Docker / PostgreSQL kurulumu yok)

1. **https://neon.tech** adresine gidin → **Sign up** (GitHub ile giriş en hızlısı).

2. **Create a project** → Proje adı: `sosyalcan` (veya istediğiniz) → **Create project**.

3. Açılan sayfada **Connection string** bölümünde **URI** seçin; aşağıdakine benzer bir satır göreceksiniz:
   ```
   postgresql://kullanici:sifre@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
   Bu satırı **kopyalayın**.

4. Proje kökündeki **`.env`** dosyasını açın. `DATABASE_URL` satırını, kopyaladığınız Neon adresiyle **tamamen** değiştirin:
   ```env
   DATABASE_URL="postgresql://kullanici:sifre@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
   ```
   (Tırnak içinde, tek satır, kendi Neon adresiniz olacak.)

5. Kaydedin. Sonra proje kökünde:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

Bu adımlardan sonra veritabanı hazır; `npm run dev` ile uygulamayı çalıştırabilirsiniz.
