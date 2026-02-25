# Appwrite Cloud — Web Site / Hostname (CORS) Nerede Eklenir?

Bu dosya, **cloud.appwrite.io** panelinde "web site yönlendirmesi" / hostname ekleme yerini adım adım anlatır.

---

## YOL 1: Genel Bakış → Entegrasyonlar (En garantisi)

1. **https://cloud.appwrite.io** adresine git, projene gir (sosyalcan).
2. **Sol menüde en üstte** — **Yetki (Auth) değil** — **"Genel Bakış"** (Overview) linkine tıkla.
3. Açılan sayfada **aşağı kaydır**.
4. **"Entegrasyonlar"** (Integrations) bölümünü bul.
5. **"Platformlar"** (Platforms) sekmesinin seçili olduğundan emin ol.
6. Sağ üstteki **"+ Platform ekle"** (Add platform) pembe butona tıkla.
7. Açılan ekranda **Web** veya **Next.js** seç; **Hostname** alanına sitenin adresini **https olmadan** yaz:
   - Örnek: `sosyalcan-git-main-eren-nezihs-projects.vercel.app`
8. Kaydet.

**Özet:** Genel Bakış → Aşağı kaydır → Entegrasyonlar → Platformlar → **+ Platform ekle** → Hostname yaz.

---

## YOL 2: Doğrudan link (Proje ayarları / domains)

Tarayıcıya şu adresi yapıştır (proje ID’n zaten içinde):

**https://cloud.appwrite.io/console/699ec6b6003b0eff8755/settings/domains**

Bu sayfa proje ayarlarında "domains" / platform listesini açar. Buradan yeni platform ekleyebilir veya mevcut platformun hostname’ini düzenleyebilirsin.

---

## Hostname nasıl yazılır?

| Doğru | Yanlış |
|-------|--------|
| `sosyalcan-git-main-eren-nezihs-projects.vercel.app` | `https://sosyalcan-git-main-...` |
| `localhost` | `http://localhost:3000` |
| `sosyalcan.vercel.app` | Sonunda `/` olmamalı |

---

## Senin CORS için gereken

Giriş yaptığın adres: **sosyalcan-git-main-eren-nezihs-projects.vercel.app**

Appwrite’da mutlaka şu hostname’in **bir platform olarak** ekli olması lazım (https olmadan):

**sosyalcan-git-main-eren-nezihs-projects.vercel.app**

Bunu ya **Genel Bakış → Entegrasyonlar → + Platform ekle** ile ekleyeceksin ya da **settings/domains** linkinden ekleyeceksin.
