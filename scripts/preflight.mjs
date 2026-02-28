import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");

// Load .env if exists
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      let val = m[2].trim().replace(/\r$/, "");
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}

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
