const STRING_SHORT = 255;
const STRING_LONG = 16384;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForAttribute() {
  await sleep(800);
}

async function ensureCollection(databases, dbId, collectionId, name) {
  try {
    await databases.getCollection(dbId, collectionId);
    console.log(`  Collection ${collectionId} already exists.`);
    return false;
  } catch {
    await databases.createCollection(dbId, collectionId, name, [], true, true);
    console.log(`  Collection ${collectionId} created.`);
    await waitForAttribute();
    return true;
  }
}

async function addString(databases, dbId, collectionId, key, size = STRING_SHORT, required = false) {
  try {
    await databases.getAttribute(dbId, collectionId, key);
    console.log(`    Attribute ${key} already exists in ${collectionId}.`);
  } catch {
    await databases.createStringAttribute(dbId, collectionId, key, size, required);
    console.log(`    Attribute ${key} created in ${collectionId}.`);
    await waitForAttribute();
  }
}

async function addInteger(databases, dbId, collectionId, key, required = false) {
  try {
    await databases.getAttribute(dbId, collectionId, key);
    console.log(`    Attribute ${key} already exists in ${collectionId}.`);
  } catch {
    await databases.createIntegerAttribute(dbId, collectionId, key, required);
    console.log(`    Attribute ${key} created in ${collectionId}.`);
    await waitForAttribute();
  }
}

async function addBoolean(databases, dbId, collectionId, key, required = false) {
  try {
    await databases.getAttribute(dbId, collectionId, key);
    console.log(`    Attribute ${key} already exists in ${collectionId}.`);
  } catch {
    await databases.createBooleanAttribute(dbId, collectionId, key, required);
    console.log(`    Attribute ${key} created in ${collectionId}.`);
    await waitForAttribute();
  }
}

async function addCommonFields(databases, dbId, collectionId) {
  await addString(databases, dbId, collectionId, "created_at", 64, false);
  await addString(databases, dbId, collectionId, "updated_at", 64, false);
  await addString(databases, dbId, collectionId, "created_by", STRING_SHORT, false);
  await addString(databases, dbId, collectionId, "archived_at", 64, false);
  await addBoolean(databases, dbId, collectionId, "is_deleted", false);
}

export async function up(databases, dbId) {
  console.log("Running migration 002_schema_v02...");

  // 1. New Collections

  // Projects
  if (await ensureCollection(databases, dbId, "projects", "Projects")) {
    await addString(databases, dbId, "projects", "customer_id", STRING_SHORT, false);
    await addString(databases, dbId, "projects", "name", STRING_SHORT, true);
    await addString(databases, dbId, "projects", "status", STRING_SHORT, true); // active | on_hold | done | archived
    await addString(databases, dbId, "projects", "start_date", 64, false);
    await addString(databases, dbId, "projects", "due_date", 64, false);
    await addInteger(databases, dbId, "projects", "budget", false); // kurus
    await addString(databases, dbId, "projects", "priority", STRING_SHORT, false); // high | medium | low
    await addString(databases, dbId, "projects", "notes", STRING_LONG, false);
    await addCommonFields(databases, dbId, "projects");
  }

  // Deliverables
  if (await ensureCollection(databases, dbId, "deliverables", "Deliverables")) {
    await addString(databases, dbId, "deliverables", "project_id", STRING_SHORT, true);
    await addString(databases, dbId, "deliverables", "type", STRING_SHORT, true); // logo | web | reels | seo | ads | branding | other
    await addString(databases, dbId, "deliverables", "title", STRING_SHORT, true);
    await addString(databases, dbId, "deliverables", "status", STRING_SHORT, true); // todo | in_progress | client_review | revision | approved | delivered | archived
    await addInteger(databases, dbId, "deliverables", "revision_count", false);
    await addBoolean(databases, dbId, "deliverables", "approval_required", false);
    await addString(databases, dbId, "deliverables", "approved_at", 64, false);
    await addString(databases, dbId, "deliverables", "due_date", 64, false);
    await addString(databases, dbId, "deliverables", "notes", STRING_LONG, false);
    await addCommonFields(databases, dbId, "deliverables");
  }

  // Contact Logs
  if (await ensureCollection(databases, dbId, "contact_logs", "Contact Logs")) {
    await addString(databases, dbId, "contact_logs", "customer_id", STRING_SHORT, true);
    await addString(databases, dbId, "contact_logs", "channel", STRING_SHORT, true); // phone | whatsapp | email | meeting | instagram | other
    await addString(databases, dbId, "contact_logs", "summary", STRING_LONG, true);
    await addString(databases, dbId, "contact_logs", "next_follow_up_at", 64, false);
    await addCommonFields(databases, dbId, "contact_logs");
  }

  // User Profiles (RBAC)
  if (await ensureCollection(databases, dbId, "user_profiles", "User Profiles")) {
    await addString(databases, dbId, "user_profiles", "user_id", STRING_SHORT, true);
    await addString(databases, dbId, "user_profiles", "role", STRING_SHORT, true); // admin | staff | readonly
    await addCommonFields(databases, dbId, "user_profiles");
  }

  // Finance Settings
  if (await ensureCollection(databases, dbId, "finance_settings", "Finance Settings")) {
    await addString(databases, dbId, "finance_settings", "bucket_owner_user_id_1", STRING_SHORT, false);
    await addString(databases, dbId, "finance_settings", "bucket_owner_user_id_2", STRING_SHORT, false);
    await addString(databases, dbId, "finance_settings", "bucket_labels", STRING_LONG, false); // JSON string
    await addString(databases, dbId, "finance_settings", "default_bucket_ratios", STRING_LONG, false); // JSON string
    await addCommonFields(databases, dbId, "finance_settings");
  }

  // 2. Update Existing Collections

  // Leads
  await addString(databases, dbId, "leads", "converted_customer_id", STRING_SHORT, false);
  await addBoolean(databases, dbId, "leads", "converting", false);
  await addCommonFields(databases, dbId, "leads");

  // Tasks
  await addString(databases, dbId, "tasks", "project_id", STRING_SHORT, false);
  await addString(databases, dbId, "tasks", "deliverable_id", STRING_SHORT, false);
  await addString(databases, dbId, "tasks", "reminder_at", 64, false);
  await addCommonFields(databases, dbId, "tasks");

  // Appointments
  await addString(databases, dbId, "appointments", "project_id", STRING_SHORT, false);
  await addString(databases, dbId, "appointments", "deliverable_id", STRING_SHORT, false);
  await addString(databases, dbId, "appointments", "task_id", STRING_SHORT, false);
  await addCommonFields(databases, dbId, "appointments");

  // Posts
  await addString(databases, dbId, "posts", "canonical_url", 2048, false);
  await addString(databases, dbId, "posts", "og_image_id", STRING_SHORT, false);
  await addString(databases, dbId, "posts", "status", STRING_SHORT, false); // draft | published | archived
  await addCommonFields(databases, dbId, "posts");

  // Add common fields to others if missing
  await addCommonFields(databases, dbId, "customers");
  await addCommonFields(databases, dbId, "subscriptions");
  await addCommonFields(databases, dbId, "transactions");
  await addCommonFields(databases, dbId, "transaction_splits");
  await addCommonFields(databases, dbId, "balances");
  await addCommonFields(databases, dbId, "audit_logs");
  await addCommonFields(databases, dbId, "notifications");
}
