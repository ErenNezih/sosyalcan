# Vercel Environment Variables

Projeyi deploy ettikten sonra Vercel → Settings → Environment Variables bölümüne şunları ekleyin:

| Değişken | Değer | Ortam |
|----------|-------|-------|
| `DATABASE_URL` | Neon connection string (pooler URL) | Production, Preview |
| `SESSION_PASSWORD` | En az 32 karakter güçlü şifre | Production, Preview |
| `SEED_USER_A_EMAIL` | erennezihberber1@gmail.com | Production, Preview |
| `SEED_USER_A_PASS` | (şifre) | Production, Preview |
| `SEED_USER_A_NAME` | Eren | Production, Preview |
| `SEED_USER_B_EMAIL` | kerim@kerim.com | Production, Preview |
| `SEED_USER_B_PASS` | (şifre) | Production, Preview |
| `SEED_USER_B_NAME` | Kerim | Production, Preview |

**DATABASE_URL** için Neon Dashboard → Connect → `.env.local` veya `Prisma` sekmesindeki connection string'i kullanın.

`.env.local` dosyasındaki değerleri buraya kopyalayabilirsiniz (güvenli tutun).
