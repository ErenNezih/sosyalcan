import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

// .env.local oncelikli, sonra .env
config({ path: resolve(rootDir, ".env.local") });
config({ path: resolve(rootDir, ".env") });

const REQUIRED_ENV_VARS = ["DATABASE_URL", "SESSION_PASSWORD"];

function run() {
  console.log("Running preflight checks...");

  const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:", missingVars.join(", "));
    process.exit(1);
  }
  console.log("✅ Environment variables present.");

  const sessionPass = process.env.SESSION_PASSWORD || "";
  if (sessionPass.length < 32) {
    console.error("❌ SESSION_PASSWORD must be at least 32 characters.");
    process.exit(1);
  }
  console.log("✅ SESSION_PASSWORD length OK.");

  console.log("✅ Preflight check passed!");
}

run();
