#!/usr/bin/env node
/**
 * .env.local oluşturma scripti (Windows uyumlu)
 * Kullanım: node scripts/create-env-local.mjs
 * Veya: npm run env:create
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const envLocalPath = resolve(rootDir, ".env.local");
const envExamplePath = resolve(rootDir, ".env.example");

function main() {
  console.log("Sosyalcan — .env.local olusturucu\n");

  const force = process.argv.includes("--force") || process.argv.includes("-f");
  if (existsSync(envLocalPath) && !force) {
    console.log(".env.local zaten mevcut. Uzerine yazmak icin: node scripts/create-env-local.mjs --force");
    process.exit(0);
  }

  let template;
  if (existsSync(envExamplePath)) {
    template = readFileSync(envExamplePath, "utf8");
    console.log(".env.example okundu.\n");
  } else {
    template = `# SOSYALCAN — .env.local
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
SESSION_PASSWORD="your-super-secret-session-password-at-least-32-chars"
SEED_USER_A_EMAIL="usera@example.com"
SEED_USER_A_PASS="UserA123!"
SEED_USER_A_NAME="User A"
SEED_USER_B_EMAIL="userb@example.com"
SEED_USER_B_PASS="UserB123!"
SEED_USER_B_NAME="User B"
`;
  }

  writeFileSync(envLocalPath, template, "utf8");
  console.log("Olusturuldu: .env.local");
  console.log("\nSonraki adimlar:");
  console.log("1) .env.local dosyasini acin");
  console.log("2) DATABASE_URL'yi Vercel Postgres veya Neon connection string ile degistirin");
  console.log("3) SESSION_PASSWORD'u en az 32 karakterlik bir sifre yapin");
  console.log("4) Komutlari calistirin:");
  console.log("   npm run db:migrate");
  console.log("   npm run db:seed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
