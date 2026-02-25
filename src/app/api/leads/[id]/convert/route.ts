import { NextResponse } from "next/server";
import { ID } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { auditLog } from "@/lib/audit";

const dbId = APPWRITE.databaseId;
const collLeads = APPWRITE.collections.leads;
const collCustomers = APPWRITE.collections.customers;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(_request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: leadId } = await params;
  const { databases } = getAppwriteAdmin();

  let lead: { $id: string; name: string; email: string; phone?: string; converted_at?: string };
  try {
    lead = await databases.getDocument(dbId, collLeads, leadId) as unknown as typeof lead;
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  if (lead.converted_at) return NextResponse.json({ error: "Already converted" }, { status: 400 });

  const customerDoc = await databases.createDocument(dbId, collCustomers, ID.unique(), {
    lead_id: leadId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    company: "",
    notes: "",
    deleted_at: "",
  });

  await databases.updateDocument(dbId, collLeads, leadId, {
    converted_at: new Date().toISOString(),
  });

  await auditLog({
    userId: session.$id,
    action: "lead.converted",
    entityType: "Lead",
    entityId: leadId,
    payload: { customerId: customerDoc.$id, leadName: lead.name },
  });

  return NextResponse.json({
    id: customerDoc.$id,
    leadId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? null,
    company: null,
    notes: null,
  });
}
