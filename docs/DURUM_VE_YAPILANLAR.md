# Sosyalcan Komuta Merkezi — Mevcut Durum ve Şimdiye Kadar Yapılanlar

Bu doküman projenin **şu anki durumunu** ve **baştan bu yana yapılan işleri** tek bir yerde, ayrıntılı biçimde özetler.

---

## 1. Proje Tanımı ve Amaç

**Sosyalcan Komuta Merkezi** (sosyalcan-komuta-merkezi v0.1.0), **Sosyalcan** markası için tek bir panelde toplanmış bir **ERP/CRM operasyon paneli**dir.

**Amaç:** Kokpit, müşteri/lead yönetimi, takvim, to-do, finans, blog/SEO ve ayarları tek uygulama içinde yönetmek.

**Kullanıcı modeli:** Kayıt sayfası yok. Sadece Appwrite Console’da tanımlı kullanıcılar e-posta ve şifre ile giriş yapabilir.

---

## 2. Mevcut Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14.2.5 (App Router), React 18 |
| Backend / Veri | **Appwrite Cloud** (Auth, Databases, Storage) — Prisma/PostgreSQL kullanılmıyor |
| Kimlik doğrulama | **Appwrite Auth** (e-posta/şifre oturumu), session cookie `a_session_<PROJECT_ID>` |
| Stil | Tailwind CSS, karanlık tema (`class="dark"`) |
| UI | Radix UI, Framer Motion, Lucide, Sonner (toast) |
| Form / Validasyon | React Hook Form, Zod, @hookform/resolvers |
| Rich text | Tiptap (Blog) |
| Sürükle-bırak | @dnd-kit (To-Do Kanban) |
| Grafik | Recharts (Finans donut) |
| PDF | jspdf (proforma fatura) |
| State | Zustand (gerekli yerlerde) |
| Diğer | date-fns, class-variance-authority, clsx, tailwind-merge |

**Kurulum:** `npm install`, `.env` (Appwrite endpoint, project ID, database ID, API key), `node setup-appwrite.mjs`, `npm run dev`.

---

## 3. Şimdiye Kadar Yapılanlar (Kronolojik Özet)

### 3.1 Vitrin ve Appwrite’a Geçiş

- **Vitrin (landing) sayfası:** Apple tarzı, karanlık temalı ana sayfa eklendi. “Demo Gör” butonu ile panele geçiş.
- **Appwrite entegrasyonu:** Prisma ve NextAuth kaldırıldı; kimlik doğrulama ve veri katmanı Appwrite (Auth, Databases) ile değiştirildi.
- **Middleware:** `/dashboard` ve altı korunuyor; oturum yoksa `/login?callbackUrl=/dashboard` yönlendirmesi. Vitrin (`/`) ve `/login` herkese açık.

### 3.2 Appwrite Altyapısı

- **İstemci (client):** `src/lib/appwrite/client.ts` — tarayıcıda Account, Databases, Storage.
- **Sunucu (server):** `src/lib/appwrite/server.ts` — API route’larında node-appwrite ile Admin erişimi.
- **Sabitler:** `src/lib/appwrite/constants.ts` — database ID, collection isimleri (snake_case: leads, customers, subscriptions, appointments, tasks, transactions, transaction_splits, balances, posts, media, audit_logs, notifications).
- **Kurulum betiği:** `setup-appwrite.mjs` — `.env`’den endpoint, project ID, database ID ve API key okuyarak veritabanı ve koleksiyonları (gerekirse) oluşturur; attribute’lar snake_case.

### 3.3 Ortam Değişkenleri ve Endpoint

- **.env:** `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`.
- **Endpoint:** Bölgeye uyum için `https://fra.cloud.appwrite.io/v1` kullanılıyor (Settings → Overview’daki API Endpoint ile aynı olmalı).
- **Proje ID:** `699ec6b6003b0eff8755`. **Database ID:** `699ec6cd003707bc4b94` (mevcut veritabanı; yeni DB oluşturma limiti nedeniyle sabit kullanılıyor).

### 3.4 Prisma / NextAuth Kalıntılarının Temizlenmesi

- Tüm `@prisma/client` ve NextAuth kullanımı kaldırıldı.
- **Tip tanımları:** `src/types/crm.ts` ve `src/types/index.ts` — Lead, Customer, Subscription, CustomerWithRelations; API yanıtları için snake_case ↔ camelCase dönüşümü.
- **Hata yönetimi:** `src/lib/db-error.ts` içinde Prisma’ya özel `isPrismaConnectionError` kaldırıldı.
- Müşteri/CRM sayfaları ve bileşenleri `@/types/crm` üzerinden tipleri kullanıyor.

### 3.5 Vitrin ve Demo Akışı

- **Arka plan videosu:** `public/assets/` altında hero videosu; vitrin bu videoyu döngüde (loop, muted) kullanıyor.
- **“Demo Gör”:** Başlangıçta `/dashboard`’e yönlendiriyordu; oturumsuz kullanıcılar ana sayfada kalıyordu. Middleware, oturumsuz `/dashboard` isteğini `/login?callbackUrl=/dashboard` ile login sayfasına yönlendirecek şekilde güncellendi; giriş sonrası dashboard açılıyor.

### 3.6 Eren/Kerim → Kullanıcı 1 / Kullanıcı 2

- **Arayüz ve metinler:** Vitrin, login placeholder, finans bakiye kartları, finans sayfası donut grafiği ve ilgili tüm metinlerde “Eren”/“Kerim” kaldırıldı; “Kullanıcı 1” ve “Kullanıcı 2” kullanılıyor.
- **API:** `src/app/api/transactions/route.ts` — Gelir dağılımında “Kullanıcı 1” ve “Kullanıcı 2” bakiye ataması, Appwrite’dan `users.list()` ile alınan **ilk iki kullanıcı** ile yapılıyor (e-posta sabit eşlemesi kaldırıldı).
- **Veritabanı uyumluluğu:** Transaction split ve balance bucket kodları (EREN, KERIM, GIDER, BIRIKIM, ACIL_DURUM) backend ve veritabanında aynen duruyor; sadece kullanıcıya dönük etiketler değişti.
- **Dokümantasyon:** `docs/PROJE_ANLATIMI.md` içinde Eren/Kerim’e atıflar kaldırıldı; Appwrite ve “Kullanıcı 1/2” ifadeleriyle güncellendi.

### 3.7 Giriş Sayfası ve Hata Mesajları

- **Login:** `src/app/login/page.tsx` — Appwrite `createEmailPasswordSession` ile giriş; başarıda `callbackUrl`’e yönlendirme.
- **Hata mesajları:**
  - **Ağ hatası** (network request failed / failed to fetch): “Appwrite sunucusuna bağlanılamadı…” — Kullanıcıya Appwrite Console’da Web platformu eklemesi (Overview veya Auth → Settings → Add platform → Web, hostname: localhost veya Vercel domain, https olmadan) anlatılıyor.
  - **Doğrulanmamış e-posta:** E-posta doğrulanmamışsa Console’da “Verify account” kullanması öneriliyor.
  - Diğer hatalar: Appwrite’dan gelen mesaj aynen gösteriliyor; yoksa “Geçersiz e-posta veya şifre.”

### 3.8 Deploy ve Versiyon Kontrolü

- **Git:** Proje GitHub’a push edildi (`https://github.com/ErenNezih/sosyalcan.git`, `main` dalı).
- **Vercel:** Canlı site Vercel’de; environment variable’ların (özellikle `NEXT_PUBLIC_APPWRITE_ENDPOINT` = `https://fra.cloud.appwrite.io/v1`) ayarlanması ve gerekirse yeniden deploy edilmesi gerekiyor.

---

## 4. Mevcut Uygulama Yapısı

### 4.1 Sayfa Akışı

- **`/`** — Vitrin (VitrinPage): karanlık tema, hero video, “Demo Gör” → oturum yoksa login’e, varsa dashboard’a.
- **`/login`** — E-posta/şifre ile Appwrite oturumu; başarıda `callbackUrl` (varsayılan `/dashboard`).
- **`/dashboard`** — Kokpit (özet metrikler, vitrin etkileşimleri, uyarılar).
- **`/dashboard/customers`** — Müşteriler ve CRM (lead listesi, müşteriye çevir, abonelik).
- **`/dashboard/temas`** — Temas (randevu/iletişim odaklı görünüm).
- **`/dashboard/calendar`** — Takvim (CRM, To-Do, Finans randevuları).
- **`/dashboard/todo`** — To-Do Kanban (Bekleyen → Kurguda → Revizede → Tamamlandı).
- **`/dashboard/finance`** — Finans (gelir/gider, donut, bakiye kartları, abonelik vade/ödeme, proforma).
- **`/dashboard/blog`** — Blog & SEO CMS (Tiptap, meta alanları).
- **`/dashboard/settings`** — Ayarlar (audit log, bildirim tercihleri).

### 4.2 API Route’lar

- **Auth:** Oturum Appwrite session cookie ile; API’lerde sunucu tarafında session/ kullanıcı doğrulaması (ilgili route’larda).
- **Veri:** Tüm CRUD işlemleri Appwrite Databases API üzerinden; collection isimleri `constants.ts` ile.
- Örnekler: `leads`, `leads/[id]/convert`, `customers`, `subscriptions`, `appointments`, `tasks`, `transactions`, `balances`, `posts`, `upload`, `notifications`, `audit`, `sse/notifications` (SSE bildirim akışı).

### 4.3 Finans Mantığı

- **Dağılım:** Gelir girişinde sabit oranlar (örn. 30/30/15/15/10) — `src/lib/finance.ts` içinde kuruş-güvenli hesaplama.
- **Bakiye:** “Kullanıcı 1” ve “Kullanıcı 2” bakiyeleri, `users.list()` ile alınan ilk iki kullanıcıya karşılık gelen bucket’lara yazılıyor; arayüzde “Kullanıcı 1” / “Kullanıcı 2” olarak gösteriliyor.

---

## 5. Ortam ve Deploy Kontrol Listesi

- **.env (yerel):**  
  `NEXT_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1`,  
  `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `APPWRITE_API_KEY`

- **Vercel Environment Variables:**  
  Aynı değişkenlerin (özellikle `NEXT_PUBLIC_*`) tanımlı olması ve endpoint’in konsoldaki API Endpoint ile aynı olması.

- **Appwrite Console:**
  - **Auth → Auth methods:** Email/Password **açık** olmalı.
  - **Platform:** Projeye bir **Web** platformu eklenmeli (Overview veya Auth → Settings’te “Add platform” → Web). **Hostname:** Canlı site için Vercel domain (örn. `sosyalcan.vercel.app`), yerel için `localhost` — protokol (https) ve port yazılmaz.
  - **Kullanıcı:** Giriş yapacak hesabın e-posta doğrulaması yapılmış olmalı (gerekirse kullanıcı detayında “Verify account”).

---

## 6. Özet Tablo

| Konu | Durum |
|------|--------|
| **Proje** | Sosyalcan Komuta Merkezi, ERP/CRM paneli |
| **Frontend** | Next.js 14 App Router, React 18, Tailwind, Radix, Framer Motion |
| **Backend / Veri** | Appwrite (Auth, Databases); Prisma/PostgreSQL yok |
| **Giriş** | Appwrite e-posta/şifre; kayıt sayfası yok |
| **Vitrin** | Karanlık landing, video, “Demo Gör” → login/dashboard |
| **Dashboard** | Kokpit, Müşteriler/CRM, Temas, Takvim, To-Do, Finans, Blog, Ayarlar |
| **Finans kullanıcı etiketleri** | Arayüzde “Kullanıcı 1” / “Kullanıcı 2”; backend’de ilk iki Appwrite kullanıcısı |
| **Kurulum betiği** | `setup-appwrite.mjs` — DB ve koleksiyonlar |
| **Deploy** | GitHub push yapıldı; canlı site Vercel’de |
| **Canlı giriş için** | Appwrite’da Email/Password açık, Web platformu (Vercel hostname) ekli, endpoint Vercel env’de doğru |

Bu doküman, projenin güncel durumunu ve bugüne kadar yapılan değişiklikleri tek referansta toplar. Implementasyon detayları için `src/app`, `src/components`, `src/lib` ve `docs/PROJE_ANLATIMI.md` kullanılabilir.
