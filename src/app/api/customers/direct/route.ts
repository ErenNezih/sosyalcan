import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { directCustomerSchema } from "@/lib/validations/lead";
import { sanitizeOptionalFields } from "@/lib/sanitize";

const dbId = APPWRITE.databaseId;
const collLeads = APPWRITE.collections.leads;
const collCustomers = APPWRITE.collections.customers;

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = directCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, phone, sector, budget, source, temperature, company, notes, customQuestionAnswer } = parsed.data;
  const sanitized = sanitizeOptionalFields(parsed.data as Record<string, unknown>);
  const email = (sanitized.email as string) || "noreply@placeholder.local";
  const { databases } = getAppwriteAdmin();

  const leadDoc = await databases.createDocument(dbId, collLeads, ID.unique(), {
    name,
    email,
    phone: phone ?? "",
    sector: sector ?? "",
    budget: budget ?? "",
    custom_question_answer: customQuestionAnswer ?? "",
    source,
    temperature,
    converted_at: new Date().toISOString(),
  });

  const customerDoc = await databases.createDocument(dbId, collCustomers, ID.unique(), {
    lead_id: leadDoc.$id,
    name,
    email,
    phone: phone ?? "",
    company: company ?? "",
    notes: notes ?? "",
    deleted_at: "",
  });

  return NextResponse.json({
    id: customerDoc.$id,
    leadId: leadDoc.$id,
    name,
    email,
    phone: phone ?? null,
    company: company ?? null,
    notes: notes ?? null,
  });
}
