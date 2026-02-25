# Vercel Deploy Öncesi Kontrol Listesi

## 1. Vercel Environment Variables

Kodda kullanılan değişken adları **tam olarak** şöyle olmalı (yanlış isim = çalışmaz):

| Key | Örnek değer | Zorunlu |
|-----|-------------|--------|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | `https://cloud.appwrite.io/v1` | Evet |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | `699ec6b6003b0eff8755` (bu proje) | Evet |
| `APPWRITE_API_KEY` | API Keys’ten oluşturduğun **tam** secret | Evet |
| `NEXT_PUBLIC_APPWRITE_DATABASE_ID` | `699ec6cd003707bc4b94` (bu proje) | Evet |

\* Veritabanı listesinde gördüğün ID (örn. `699ec6cd003707bc4b94`). Kod varsayılan olarak `sosyalcan_db` kullanır; Appwrite’da veritabanını bu ID ile oluşturmadıysan mutlaka bu env’i ekle.

**Dikkat:** `NEXT_PUBLIC_APPWRITE_PROJECT` değil, **`NEXT_PUBLIC_APPWRITE_PROJECT_ID`** olmalı.

- Her key’ten **tek** satır olmalı; aynı isimle birden fazla tanım olmasın.
- `APPWRITE_API_KEY` placeholder değil, gerçek secret olmalı (başında `standard_` olan tam key).

---

## 2. Appwrite Veritabanı

- **Veritabanları** bölümünde bir veritabanı olmalı.
- **Tablolar** boşsa (`Henüz tablo yok`) önce yerelde:
  ```bash
  node setup-appwrite.mjs
  ```
  çalıştır. `.env` içinde aynı `PROJECT_ID` ve (varsa) `DATABASE_ID` kullan. Bu betik koleksiyonları ve attribute’ları oluşturur.

---

## 3. Appwrite Kullanıcı

- **Yetki → Kullanıcılar** bölümünde en az bir kullanıcı (e-posta/şifre) olmalı.
- Yoksa sitede giriş yapılamaz; dashboard’a kimse ulaşamaz.

---

## 4. Özet: Deploy’dan Önce

1. Vercel’de env: `PROJECT_ID`, `DATABASE_ID`, `API_KEY`, `ENDPOINT` doğru ve tek.
2. Appwrite’da tablolar var (setup-appwrite.mjs çalıştırıldı).
3. Appwrite’da en az bir giriş kullanıcısı var.

Bunlar tamamsa deploy edebilirsin; site ayağa kalkar ve giriş çalışır.
