import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { mapDocument, mapDocumentList, Query } from "@/lib/appwrite/helpers";
import { leadSchema } from "@/lib/validations/lead";
import { sanitizeOptionalFields } from "@/lib/sanitize";

const dbId = APPWRITE.databaseId;
const collLeads = APPWRITE.collections.leads;
const collCustomers = APPWRITE.collections.customers;

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const archived = new URL(request.url).searchParams.get("archived");
  const leadQueries = [Query.orderDesc("$createdAt")];
  if (archived === "true") leadQueries.push(Query.equal("is_deleted", true));
  else if (archived !== "all") leadQueries.push(Query.notEqual("is_deleted", true));

  const { databases } = getAppwriteAdmin();
  const [leadsRes, customersRes] = await Promise.all([
    databases.listDocuments(dbId, collLeads, leadQueries),
    databases.listDocuments(dbId, collCustomers, []),
  ]);

  const customersByLeadId = new Map<string, Record<string, unknown>>();
  for (const c of customersRes.documents) {
    const leadId = (c as unknown as { lead_id?: string }).lead_id;
    if (leadId) customersByLeadId.set(leadId, mapDocument(c) as Record<string, unknown>);
  }

  const leads = mapDocumentList(leadsRes).map((lead) => ({
    ...lead,
    customer: customersByLeadId.get(lead.id) ?? null,
  }));
  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const sanitized = sanitizeOptionalFields(parsed.data as Record<string, unknown>);
  const data = {
    name: parsed.data.name,
    email: (sanitized.email as string) || "noreply@placeholder.local",
    phone: parsed.data.phone ?? "",
    sector: parsed.data.sector ?? "",
    budget: parsed.data.budget ?? "",
    custom_question_answer: parsed.data.customQuestionAnswer ?? "",
    source: parsed.data.source,
    temperature: parsed.data.temperature,
  };

  const doc = await databases.createDocument(dbId, collLeads, ID.unique(), data);
  return NextResponse.json({
    id: doc.$id,
    createdAt: doc.$createdAt,
    updatedAt: doc.$updatedAt,
    ...data,
  });
}
