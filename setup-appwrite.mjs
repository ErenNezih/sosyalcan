/**
 * Appwrite veritabanı otomatik kurulum betiği.
 * Tüm koleksiyonları ve attribute'ları (snake_case) oluşturur.
 *
 * Kullanım: node setup-appwrite.mjs
 * (Proje kökünden çalıştırın; .env varsa otomatik yüklenir.
 *  Yoksa aşağıdaki placeholder'ları doldurun.)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// .env dosyasını yükle (proje kökünde ise)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, ".env");
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

// ========== ENV BİLGİLERİ — İsterseniz buraya manuel girin ==========
const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
const API_KEY = process.env.APPWRITE_API_KEY ?? "";
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "sosyalcan_db";
// =======================================================================

import { Client, Databases } from "node-appwrite";

const STRING_SHORT = 255;
const STRING_LONG = 16384;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Attribute oluşturduktan sonra Appwrite'ın işlemesi için kısa bekleme */
async function waitForAttribute() {
  await sleep(800);
}

async function ensureDatabase(databases) {
  try {
    await databases.get(DATABASE_ID);
    console.log("  Veritabanı zaten mevcut:", DATABASE_ID);
  } catch {
    await databases.create(DATABASE_ID, "Sosyalcan");
    console.log("  Veritabanı oluşturuldu:", DATABASE_ID);
  }
}

async function ensureCollection(databases, collectionId, name) {
  try {
    await databases.getCollection(DATABASE_ID, collectionId);
    console.log("  Koleksiyon zaten mevcut:", collectionId);
    return false;
  } catch {
    await databases.createCollection(DATABASE_ID, collectionId, name, [], true, true);
    console.log("  Koleksiyon oluşturuldu:", collectionId);
    await waitForAttribute();
    return true;
  }
}

async function addString(databases, collectionId, key, size = STRING_SHORT, required = false) {
  await databases.createStringAttribute(DATABASE_ID, collectionId, key, size, required);
  await waitForAttribute();
}

async function addInteger(databases, collectionId, key, required = false) {
  await databases.createIntegerAttribute(DATABASE_ID, collectionId, key, required);
  await waitForAttribute();
}

async function addFloat(databases, collectionId, key, required = false) {
  await databases.createFloatAttribute(DATABASE_ID, collectionId, key, required);
  await waitForAttribute();
}

async function addBoolean(databases, collectionId, key, required = false) {
  await databases.createBooleanAttribute(DATABASE_ID, collectionId, key, required);
  await waitForAttribute();
}

async function setupLeads(databases) {
  const created = await ensureCollection(databases, "leads", "Leads");
  if (!created) return;
  await addString(databases, "leads", "name", STRING_SHORT, true);
  await addString(databases, "leads", "email", STRING_SHORT, true);
  await addString(databases, "leads", "phone");
  await addString(databases, "leads", "sector");
  await addString(databases, "leads", "budget");
  await addString(databases, "leads", "custom_question_answer", STRING_LONG);
  await addString(databases, "leads", "source");
  await addString(databases, "leads", "temperature");
  await addString(databases, "leads", "converted_at", 64);
}

async function setupCustomers(databases) {
  const created = await ensureCollection(databases, "customers", "Customers");
  if (!created) return;
  await addString(databases, "customers", "lead_id");
  await addString(databases, "customers", "name", STRING_SHORT, true);
  await addString(databases, "customers", "email", STRING_SHORT, true);
  await addString(databases, "customers", "phone");
  await addString(databases, "customers", "company");
  await addString(databases, "customers", "notes", STRING_LONG);
  await addString(databases, "customers", "deleted_at", 64);
}

async function setupSubscriptions(databases) {
  const created = await ensureCollection(databases, "subscriptions", "Subscriptions");
  if (!created) return;
  await addString(databases, "subscriptions", "customer_id", STRING_SHORT, true);
  await addString(databases, "subscriptions", "plan_name");
  await addString(databases, "subscriptions", "package_type");
  await addInteger(databases, "subscriptions", "amount", true);
  await addString(databases, "subscriptions", "start_date", 64);
  await addString(databases, "subscriptions", "next_payment_date", 64);
  await addString(databases, "subscriptions", "status");
  await addString(databases, "subscriptions", "remaining_amount", 64);
  await addString(databases, "subscriptions", "remaining_due_date", 64);
}

async function setupAppointments(databases) {
  const created = await ensureCollection(databases, "appointments", "Appointments");
  if (!created) return;
  await addString(databases, "appointments", "title", STRING_SHORT, true);
  await addString(databases, "appointments", "description", STRING_LONG);
  await addString(databases, "appointments", "start", 64, true);
  await addString(databases, "appointments", "end", 64, true);
  await addString(databases, "appointments", "type", STRING_SHORT, true);
  await addString(databases, "appointments", "related_id");
  await addString(databases, "appointments", "related_type");
  await addString(databases, "appointments", "user_id");
}

async function setupTasks(databases) {
  const created = await ensureCollection(databases, "tasks", "Tasks");
  if (!created) return;
  await addString(databases, "tasks", "title", STRING_SHORT, true);
  await addString(databases, "tasks", "description", STRING_LONG);
  await addString(databases, "tasks", "status");
  await addString(databases, "tasks", "assignee_id");
  await addString(databases, "tasks", "urgency");
  await addString(databases, "tasks", "due_date", 64);
  await addInteger(databases, "tasks", "order");
}

async function setupTransactions(databases) {
  const created = await ensureCollection(databases, "transactions", "Transactions");
  if (!created) return;
  await addString(databases, "transactions", "type", STRING_SHORT, true);
  await addFloat(databases, "transactions", "amount", true);
  await addString(databases, "transactions", "description", STRING_LONG);
  await addString(databases, "transactions", "date", 64, true);
  await addString(databases, "transactions", "category");
  await addString(databases, "transactions", "customer_id");
  await addString(databases, "transactions", "status");
  await addString(databases, "transactions", "created_by");
  await addString(databases, "transactions", "subscription_id");
  await addBoolean(databases, "transactions", "is_partial_payment");
  await addString(databases, "transactions", "expense_tag");
}

async function setupTransactionSplits(databases) {
  const created = await ensureCollection(databases, "transaction_splits", "Transaction Splits");
  if (!created) return;
  await addString(databases, "transaction_splits", "transaction_id", STRING_SHORT, true);
  await addString(databases, "transaction_splits", "bucket", STRING_SHORT, true);
  await addFloat(databases, "transaction_splits", "percentage");
  await addFloat(databases, "transaction_splits", "amount", true);
}

async function setupBalances(databases) {
  const created = await ensureCollection(databases, "balances", "Balances");
  if (!created) return;
  await addString(databases, "balances", "user_id");
  await addString(databases, "balances", "bucket", STRING_SHORT, true);
  await addFloat(databases, "balances", "balance", true);
}

async function setupPosts(databases) {
  const created = await ensureCollection(databases, "posts", "Posts");
  if (!created) return;
  await addString(databases, "posts", "title", STRING_SHORT, true);
  await addString(databases, "posts", "slug", STRING_SHORT, true);
  await addString(databases, "posts", "content", STRING_LONG);
  await addString(databases, "posts", "cover_image_url", 2048);
  await addString(databases, "posts", "meta_title");
  await addString(databases, "posts", "meta_description", 512);
  await addString(databases, "posts", "published_at", 64);
  await addString(databases, "posts", "author_id");
}

async function setupAuditLogs(databases) {
  const created = await ensureCollection(databases, "audit_logs", "Audit Logs");
  if (!created) return;
  await addString(databases, "audit_logs", "user_id", STRING_SHORT, true);
  await addString(databases, "audit_logs", "action", STRING_SHORT, true);
  await addString(databases, "audit_logs", "entity_type", STRING_SHORT, true);
  await addString(databases, "audit_logs", "entity_id", STRING_SHORT, true);
  await addString(databases, "audit_logs", "payload", STRING_LONG);
}

async function setupNotifications(databases) {
  const created = await ensureCollection(databases, "notifications", "Notifications");
  if (!created) return;
  await addString(databases, "notifications", "user_id");
  await addString(databases, "notifications", "title", STRING_SHORT);
  await addString(databases, "notifications", "message", STRING_LONG);
  await addString(databases, "notifications", "read_at", 64);
}

async function main() {
  if (!PROJECT_ID || !API_KEY) {
    console.error("Hata: NEXT_PUBLIC_APPWRITE_PROJECT_ID ve APPWRITE_API_KEY zorunludur.");
    console.error("  .env dosyasında tanımlayın veya bu dosyanın üstündeki placeholder'ları doldurun.");
    process.exit(1);
  }

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const databases = new Databases(client);

  console.log("Appwrite veritabanı kurulumu başlıyor...");
  console.log("  Endpoint:", ENDPOINT);
  console.log("  Project:", PROJECT_ID);
  console.log("  Database ID:", DATABASE_ID);

  try {
    await ensureDatabase(databases);
    console.log("\nKoleksiyonlar oluşturuluyor...");

    await setupLeads(databases);
    await setupCustomers(databases);
    await setupSubscriptions(databases);
    await setupAppointments(databases);
    await setupTasks(databases);
    await setupTransactions(databases);
    await setupTransactionSplits(databases);
    await setupBalances(databases);
    await setupPosts(databases);
    await setupAuditLogs(databases);
    await setupNotifications(databases);

    console.log("\nKurulum tamamlandı.");
  } catch (err) {
    console.error("Hata:", err.message ?? err);
    process.exit(1);
  }
}

main();
