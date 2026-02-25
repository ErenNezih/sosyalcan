# Giriş (Login) Hata Ayıklama Rehberi

Bu doküman, Appwrite + Next.js giriş sorunlarını adım adım nasıl teşhis edeceğinizi ve Appwrite Console ayarlarını nasıl kontrol edeceğinizi açıklar.

---

## 1. Kod Tarafında Yapılan Debug Desteği

### A. Çerez (Cookie) ve Middleware

- **Dosya:** `src/middleware.ts`
- **Mantık:** Appwrite oturum çerezi `a_session_<PROJECT_ID>` formatındadır (küçük harf). Middleware bu isimle çerezin varlığını kontrol eder; `/dashboard` ve altında yoksa `/login?callbackUrl=...` yönlendirmesi yapar.
- **Debug:** Aynı isteğe `?debug=auth` ekleyerek yanıt header'larında session bilgisini görebilirsiniz.
  - **Nasıl:** Tarayıcıda şu adreslerden birini açın:
    - `https://siteniz.vercel.app/dashboard?debug=auth`
    - veya `https://siteniz.vercel.app/login?debug=auth`
  - **F12 → Network** → İlgili isteği seçin → **Headers** → **Response Headers**:
    - `X-Debug-Auth-Cookie-Name`: Aranan çerez adı (örn. `a_session_699ec6b6003b0eff8755`)
    - `X-Debug-Auth-Session-Found`: `1` = oturum var, `0` = oturum yok
    - `X-Debug-Auth-Project-Id`: Proje ID (veya `missing`)

**Opsiyonel (Vercel log):** Middleware içindeki `console.log` satırının yorumunu kaldırırsanız, Vercel Dashboard → Project → Logs (Runtime) bölümünde her istek için cookie adı ve session durumu görünür.

### B. Appwrite İstemci (Client) Başlatma

- **Dosya:** `src/lib/appwrite/client.ts`
- **Mantık:** `NEXT_PUBLIC_APPWRITE_ENDPOINT` ve `NEXT_PUBLIC_APPWRITE_PROJECT_ID` build sırasında bundle’a gömülür. Vercel’de bu değişkenler **Build** ortamında tanımlı olmalıdır (sadece Production/Preview değil, build anında okunur).
- **Debug:** Login sayfası açıldığında tarayıcı konsolunda (F12 → Console) şu satırı arayın:
  - `[Login] Appwrite config: OK (endpoint + projectId set)` → Env doğru.
  - `[Login] Appwrite config: Eksik: NEXT_PUBLIC_...` → Env eksik; Vercel’de Environment Variables’a ekleyip **yeniden build** alın.

### C. Hata Yakalama (Login Sayfası)

- **Dosya:** `src/app/login/page.tsx`
- **Mantık:** `createEmailPasswordSession` hata fırlattığında:
  - Hata mesajı kullanıcıya gösterilir.
  - **Hata detayı** (code, type, response) hem **konsola** hem de form altında “Hata detayı: …” olarak yazılır.
- **F12 → Console:** `[Login] createEmailPasswordSession failed:` ile başlayan nesneye bakın:
  - `code`: Appwrite HTTP benzeri hata kodu (401, 404, 412 vb.)
  - `message`, `type`, `response`: API’den dönen detay.

---

## 2. Tarayıcıda Kontrol Edilecekler (F12)

### Console Sekmesi

| Ne zaman | Ne arayın |
|----------|------------|
| Login sayfası ilk açıldığında | `[Login] Appwrite config:` — env OK mu, eksik mi? |
| Giriş butonuna basıldıktan sonra hata varsa | `[Login] createEmailPasswordSession failed:` — `code`, `message`, `response` |

### Network Sekmesi

1. **Preserve log** işaretli olsun.
2. Giriş yap’a tıklayın.
3. **Appwrite endpoint’ine giden isteği** bulun (örn. `https://fra.cloud.appwrite.io/v1/account/sessions/email` veya benzeri).
4. Bu isteğe tıklayıp kontrol edin:
   - **Status:** 401 (yetkisiz), 403 (yasak), 412 (ön koşul), 0 / CORS/failed → Ağ/CORS sorunu.
   - **Headers → Request URL:** Doğru endpoint ve path mi?
   - **Response:** JSON içinde `message` veya `code` varsa bunu Console’daki detayla eşleştirin.

### Cookie Sekmesi (Application / Storage)

- Giriş **başarılı** olduktan sonra (eğer bir an dashboard açılıp tekrar login’e düşüyorsanız):
  - **Application → Cookies → siteniz**
  - `a_session_699ec6b6003b0eff8755` (veya proje ID’nize göre) var mı?
  - **SameSite / Secure:** SameSite=Lax veya Strict, Secure=true (HTTPS’te) beklenir. Appwrite’ın set ettiği değerler aynen kalmalı.

---

## 3. Appwrite Console Kontrol Listesi

### 3.1 Web Platform (Hostname)

- **Nereye girilir:** Appwrite Console → Projeniz → **Overview** (veya proje ilk kurulumunda “Add platform”) **veya** **Auth → Settings** (bazı sürümlerde “Platforms” burada).
- **Ne yapılır:** “Add platform” → **Web** seçin.
- **Hostname nasıl yazılır:**
  - **Doğru:** `sosyalcan.vercel.app` veya `localhost` (protokol ve port **yok**).
  - **Yanlış:** `https://sosyalcan.vercel.app`, `http://localhost:3000`, `https://sosyalcan.vercel.app/`.
- Canlı site Vercel’deyse, Vercel’de gördüğünüz tam domain’i (alt domain dahil) **https olmadan** tek hostname olarak ekleyin. İsterseniz ayrı satırda `localhost` da ekleyebilirsiniz (yerel test için).

### 3.2 Email/Password Auth Metodu

- **Nereye girilir:** **Auth → Settings**.
- **Kontrol:** “Auth methods” bölümünde **Email/Password** açık (enabled) olmalı. Kapalıysa giriş isteği reddedilir veya yanlış hata kodu döner.

### 3.3 Kullanıcı “Verified” (Doğrulanmış) Durumu

- **Nereye girilir:** **Auth → Users** → ilgili kullanıcıya tıklayın.
- **Kontrol:** E-posta yanında “Verified” / “Doğrulanmış” yazıyor olmalı. “Unverified” ise birçok projede `createEmailPasswordSession` oturum oluşturmaz veya 401/403 döner.
- **Çözüm:** Kullanıcı detayında **“Verify account”** ile hesabı doğrulayın.

### 3.4 Özet Tablo

| Ayar | Nerede | Beklenen |
|------|--------|----------|
| Web platform hostname | Overview veya Auth → Settings | Sitenin domain’i, **https:// olmadan** (örn. `sosyalcan.vercel.app`) |
| Email/Password | Auth → Settings → Auth methods | **Açık** |
| Kullanıcı verified | Auth → Users → [kullanıcı] | **Verified** |

---

## 4. Terminal / Log Adımları

1. **Yerel:** `npm run build` → Build sırasında `NEXT_PUBLIC_APPWRITE_*` uyarısı çıkıyorsa env eksik demektir (Next.js bazen eksik public env’de uyarı verir).
2. **Vercel:** Dashboard → Project → **Settings → Environment Variables** → `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID` hem **Production** hem **Preview** için tanımlı olsun (build’de kullanılır). Değişiklikten sonra **Redeploy** yapın.
3. **Vercel Runtime Logs:** Deploy sonrası canlı sitede `/dashboard?debug=auth` veya `/login?debug=auth` isteği atın; middleware’deki `console.log` açıksa Logs’ta cookie adı ve session durumunu görürsünüz.

---

## 5. Sık Görülen Hatalar ve Anlamları

| Konsol/Network | Olası neden | Yapılacak |
|----------------|-------------|-----------|
| `Network request failed` / `Failed to fetch` | CORS veya hostname izni yok | Appwrite’da Web platformu + hostname (https olmadan) ekleyin |
| `[Login] Appwrite config: Eksik: ...` | Env build’e girmemiş | Vercel’de env ekleyip redeploy |
| 401 Unauthorized | Yanlış şifre veya unverified kullanıcı | Şifreyi doğrulayın; Console’da “Verify account” yapın |
| 412 Precondition Failed | Genelde doğrulanmamış e-posta | Auth → Users → Verify account |
| Giriş başarılı ama hemen tekrar login’e düşme | Cookie okunmuyor veya yanlış domain | `?debug=auth` ile header’lara bakın; cookie adı ve Project ID’yi karşılaştırın |

Bu rehber, `middleware.ts`, `client.ts` ve `login/page.tsx` içindeki debug eklemeleriyle uyumludur.
