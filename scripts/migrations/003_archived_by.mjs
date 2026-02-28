/**
 * Migration 003: Add archived_by to all collections for soft delete tracking.
 * Idempotent: skips if attribute already exists.
 */
const STRING_SHORT = 255;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function addString(databases, dbId, collectionId, key, size = STRING_SHORT, required = false) {
  try {
    await databases.getAttribute(dbId, collectionId, key);
    console.log(`    Attribute ${key} already exists in ${collectionId}.`);
  } catch {
    await databases.createStringAttribute(dbId, collectionId, key, size, required);
    console.log(`    Attribute ${key} created in ${collectionId}.`);
    await sleep(800);
  }
}

const COLLECTIONS_WITH_ARCHIVE = [
  "leads",
  "customers",
  "subscriptions",
  "appointments",
  "tasks",
  "transactions",
  "transaction_splits",
  "balances",
  "posts",
  "notifications",
  "projects",
  "deliverables",
  "contact_logs",
  "user_profiles",
  "finance_settings",
  "audit_logs",
];

export async function up(databases, dbId) {
  console.log("Running migration 003_archived_by...");

  for (const coll of COLLECTIONS_WITH_ARCHIVE) {
    try {
      await databases.getCollection(dbId, coll);
      await addString(databases, dbId, coll, "archived_by", STRING_SHORT, false);
    } catch (e) {
      console.log(`  Skipping ${coll}: collection may not exist - ${e.message}`);
    }
  }

  console.log("Migration 003_archived_by completed.");
}
