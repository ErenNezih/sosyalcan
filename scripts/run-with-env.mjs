#!/usr/bin/env node
/**
 * .env.local ve .env yukleyerek komut calistirir (Windows uyumlu)
 * Prisma migrate/seed icin DATABASE_URL'nin .env.local'den okunmasini saglar.
 * Kullanim: node scripts/run-with-env.mjs npx prisma migrate deploy
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// Once .env, sonra .env.local (override: true ile .env.local kazanir)
config({ path: resolve(rootDir, ".env") });
config({ path: resolve(rootDir, ".env.local"), override: true });

const [, , ...args] = process.argv;
if (args.length === 0) {
  console.error("Kullanim: node scripts/run-with-env.mjs <komut> [args...]");
  process.exit(1);
}

const [cmd, ...cmdArgs] = args;
const isWindows = process.platform === "win32";
const result = spawnSync(cmd, cmdArgs, {
  stdio: "inherit",
  env: { ...process.env },
  shell: isWindows,
  cwd: rootDir,
});

process.exit(result.status ?? (result.signal ? 1 : 0));
