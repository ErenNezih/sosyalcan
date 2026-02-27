import { Client, Databases, Query, ID } from "node-appwrite";
import { readFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

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

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

if (!ENDPOINT || !PROJECT_ID || !API_KEY || !DATABASE_ID) {
  console.error("Missing required environment variables.");
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const MIGRATIONS_COLLECTION = "migrations";

async function ensureDatabase() {
  try {
    await databases.get(DATABASE_ID);
  } catch {
    console.log(`Creating database: ${DATABASE_ID}`);
    await databases.create(DATABASE_ID, "Sosyalcan");
  }
}

async function ensureMigrationsCollection() {
  try {
    await databases.getCollection(DATABASE_ID, MIGRATIONS_COLLECTION);
  } catch {
    console.log("Creating migrations collection...");
    await databases.createCollection(DATABASE_ID, MIGRATIONS_COLLECTION, "Migrations");
    await sleep(1000);
    await databases.createStringAttribute(DATABASE_ID, MIGRATIONS_COLLECTION, "name", 255, true);
    await databases.createStringAttribute(DATABASE_ID, MIGRATIONS_COLLECTION, "applied_at", 64, true);
    await databases.createStringAttribute(DATABASE_ID, MIGRATIONS_COLLECTION, "checksum", 64, true);
    await sleep(1000);
  }
}

async function getAppliedMigrations() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      MIGRATIONS_COLLECTION,
      [Query.limit(100)]
    );
    return response.documents.map(doc => doc.name);
  } catch {
    return [];
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log("Starting migrations...");
  await ensureDatabase();
  await ensureMigrationsCollection();

  const appliedMigrations = await getAppliedMigrations();
  const migrationsDir = join(__dirname, "migrations");
  
  if (!existsSync(migrationsDir)) {
    console.log("No migrations directory found.");
    return;
  }

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith(".mjs"))
    .sort();

  for (const file of files) {
    if (appliedMigrations.includes(file)) {
      console.log(`Skipping applied migration: ${file}`);
      continue;
    }

    console.log(`Running migration: ${file}`);
    const migrationPath = join(migrationsDir, file);
    const migration = await import("file://" + migrationPath);
    
    // Calculate checksum
    const content = readFileSync(migrationPath, "utf8");
    const checksum = createHash("md5").update(content).digest("hex");

    try {
      await migration.up(databases, DATABASE_ID);
      
      await databases.createDocument(
        DATABASE_ID,
        MIGRATIONS_COLLECTION,
        ID.unique(),
        {
          name: file,
          applied_at: new Date().toISOString(),
          checksum
        }
      );
      console.log(`Migration ${file} applied successfully.`);
    } catch (error) {
      console.error(`Error applying migration ${file}:`, error);
      process.exit(1);
    }
  }
  console.log("All migrations completed.");
}

run();
