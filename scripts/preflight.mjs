import { Client, Databases } from "node-appwrite";
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

const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  "NEXT_PUBLIC_APPWRITE_DATABASE_ID",
  "APPWRITE_API_KEY"
];

const REQUIRED_COLLECTIONS = [
  "leads",
  "customers",
  "subscriptions",
  "appointments",
  "tasks",
  "transactions",
  "transaction_splits",
  "balances",
  "posts",
  "media",
  "audit_logs",
  "notifications",
  "projects",
  "deliverables",
  "contact_logs",
  "user_profiles",
  "finance_settings"
];

async function run() {
  console.log("Running preflight checks...");

  // 1. Check Environment Variables
  const missingVars = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.error("❌ Missing environment variables:", missingVars.join(", "));
    process.exit(1);
  }
  console.log("✅ Environment variables present.");

  // 2. Check Appwrite Connection
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

  try {
    await databases.get(dbId);
    console.log("✅ Appwrite database connected.");
  } catch (error) {
    console.error("❌ Failed to connect to Appwrite database:", error.message);
    process.exit(1);
  }

  // 3. Check Collections
  console.log("Checking collections...");
  const missingCollections = [];
  for (const col of REQUIRED_COLLECTIONS) {
    try {
      await databases.getCollection(dbId, col);
    } catch {
      missingCollections.push(col);
    }
  }

  if (missingCollections.length > 0) {
    console.warn("⚠️ Missing collections:", missingCollections.join(", "));
    console.warn("   Run 'node scripts/migrate-appwrite.mjs' to fix this.");
    // We don't fail here because migration might be part of the deployment process
  } else {
    console.log("✅ All required collections exist.");
  }

  console.log("✅ Preflight check passed!");
}

run();
