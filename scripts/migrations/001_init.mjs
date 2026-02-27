import { Client, Databases, Query, ID } from "node-appwrite";

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
  await databases.createStringAttribute(dbId, collectionId, key, size, required);
  await waitForAttribute();
}

async function addInteger(databases, dbId, collectionId, key, required = false) {
  await databases.createIntegerAttribute(dbId, collectionId, key, required);
  await waitForAttribute();
}

async function addFloat(databases, dbId, collectionId, key, required = false) {
  await databases.createFloatAttribute(dbId, collectionId, key, required);
  await waitForAttribute();
}

async function addBoolean(databases, dbId, collectionId, key, required = false) {
  await databases.createBooleanAttribute(dbId, collectionId, key, required);
  await waitForAttribute();
}

export async function up(databases, dbId) {
  console.log("Running migration 001_init...");

  // Leads
  if (await ensureCollection(databases, dbId, "leads", "Leads")) {
    await addString(databases, dbId, "leads", "name", STRING_SHORT, true);
    await addString(databases, dbId, "leads", "email", STRING_SHORT, true);
    await addString(databases, dbId, "leads", "phone");
    await addString(databases, dbId, "leads", "sector");
    await addString(databases, dbId, "leads", "budget");
    await addString(databases, dbId, "leads", "custom_question_answer", STRING_LONG);
    await addString(databases, dbId, "leads", "source");
    await addString(databases, dbId, "leads", "temperature");
    await addString(databases, dbId, "leads", "converted_at", 64);
  }

  // Customers
  if (await ensureCollection(databases, dbId, "customers", "Customers")) {
    await addString(databases, dbId, "customers", "lead_id");
    await addString(databases, dbId, "customers", "name", STRING_SHORT, true);
    await addString(databases, dbId, "customers", "email", STRING_SHORT, true);
    await addString(databases, dbId, "customers", "phone");
    await addString(databases, dbId, "customers", "company");
    await addString(databases, dbId, "customers", "notes", STRING_LONG);
    await addString(databases, dbId, "customers", "deleted_at", 64);
  }

  // Subscriptions
  if (await ensureCollection(databases, dbId, "subscriptions", "Subscriptions")) {
    await addString(databases, dbId, "subscriptions", "customer_id", STRING_SHORT, true);
    await addString(databases, dbId, "subscriptions", "plan_name");
    await addString(databases, dbId, "subscriptions", "package_type");
    await addInteger(databases, dbId, "subscriptions", "amount", true);
    await addString(databases, dbId, "subscriptions", "start_date", 64);
    await addString(databases, dbId, "subscriptions", "next_payment_date", 64);
    await addString(databases, dbId, "subscriptions", "status");
    await addString(databases, dbId, "subscriptions", "remaining_amount", 64);
    await addString(databases, dbId, "subscriptions", "remaining_due_date", 64);
  }

  // Appointments
  if (await ensureCollection(databases, dbId, "appointments", "Appointments")) {
    await addString(databases, dbId, "appointments", "title", STRING_SHORT, true);
    await addString(databases, dbId, "appointments", "description", STRING_LONG);
    await addString(databases, dbId, "appointments", "start", 64, true);
    await addString(databases, dbId, "appointments", "end", 64, true);
    await addString(databases, dbId, "appointments", "type", STRING_SHORT, true);
    await addString(databases, dbId, "appointments", "related_id");
    await addString(databases, dbId, "appointments", "related_type");
    await addString(databases, dbId, "appointments", "user_id");
  }

  // Tasks
  if (await ensureCollection(databases, dbId, "tasks", "Tasks")) {
    await addString(databases, dbId, "tasks", "title", STRING_SHORT, true);
    await addString(databases, dbId, "tasks", "description", STRING_LONG);
    await addString(databases, dbId, "tasks", "status");
    await addString(databases, dbId, "tasks", "assignee_id");
    await addString(databases, dbId, "tasks", "urgency");
    await addString(databases, dbId, "tasks", "due_date", 64);
    await addInteger(databases, dbId, "tasks", "order");
  }

  // Transactions
  if (await ensureCollection(databases, dbId, "transactions", "Transactions")) {
    await addString(databases, dbId, "transactions", "type", STRING_SHORT, true);
    await addFloat(databases, dbId, "transactions", "amount", true);
    await addString(databases, dbId, "transactions", "description", STRING_LONG);
    await addString(databases, dbId, "transactions", "date", 64, true);
    await addString(databases, dbId, "transactions", "category");
    await addString(databases, dbId, "transactions", "customer_id");
    await addString(databases, dbId, "transactions", "status");
    await addString(databases, dbId, "transactions", "created_by");
    await addString(databases, dbId, "transactions", "subscription_id");
    await addBoolean(databases, dbId, "transactions", "is_partial_payment");
    await addString(databases, dbId, "transactions", "expense_tag");
  }

  // Transaction Splits
  if (await ensureCollection(databases, dbId, "transaction_splits", "Transaction Splits")) {
    await addString(databases, dbId, "transaction_splits", "transaction_id", STRING_SHORT, true);
    await addString(databases, dbId, "transaction_splits", "bucket", STRING_SHORT, true);
    await addFloat(databases, dbId, "transaction_splits", "percentage");
    await addFloat(databases, dbId, "transaction_splits", "amount", true);
  }

  // Balances
  if (await ensureCollection(databases, dbId, "balances", "Balances")) {
    await addString(databases, dbId, "balances", "user_id");
    await addString(databases, dbId, "balances", "bucket", STRING_SHORT, true);
    await addFloat(databases, dbId, "balances", "balance", true);
  }

  // Posts
  if (await ensureCollection(databases, dbId, "posts", "Posts")) {
    await addString(databases, dbId, "posts", "title", STRING_SHORT, true);
    await addString(databases, dbId, "posts", "slug", STRING_SHORT, true);
    await addString(databases, dbId, "posts", "content", STRING_LONG);
    await addString(databases, dbId, "posts", "cover_image_url", 2048);
    await addString(databases, dbId, "posts", "meta_title");
    await addString(databases, dbId, "posts", "meta_description", 512);
    await addString(databases, dbId, "posts", "published_at", 64);
    await addString(databases, dbId, "posts", "author_id");
  }

  // Audit Logs
  if (await ensureCollection(databases, dbId, "audit_logs", "Audit Logs")) {
    await addString(databases, dbId, "audit_logs", "user_id", STRING_SHORT, true);
    await addString(databases, dbId, "audit_logs", "action", STRING_SHORT, true);
    await addString(databases, dbId, "audit_logs", "entity_type", STRING_SHORT, true);
    await addString(databases, dbId, "audit_logs", "entity_id", STRING_SHORT, true);
    await addString(databases, dbId, "audit_logs", "payload", STRING_LONG);
  }

  // Notifications
  if (await ensureCollection(databases, dbId, "notifications", "Notifications")) {
    await addString(databases, dbId, "notifications", "user_id");
    await addString(databases, dbId, "notifications", "title", STRING_SHORT);
    await addString(databases, dbId, "notifications", "message", STRING_LONG);
    await addString(databases, dbId, "notifications", "read_at", 64);
  }
}
