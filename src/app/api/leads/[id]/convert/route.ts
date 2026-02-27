import { NextResponse } from "next/server";
import { ID, Query } from "node-appwrite";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { auditLog } from "@/lib/audit";
import { requireRole } from "@/lib/auth/rbac";

const dbId = APPWRITE.databaseId;
const collLeads = APPWRITE.collections.leads;
const collCustomers = APPWRITE.collections.customers;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { authorized, user } = await requireRole(request, ["admin", "staff"]);
  if (!authorized || !user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: leadId } = await params;
  const { databases } = getAppwriteAdmin();

  let lead: { 
    $id: string; 
    name: string; 
    email: string; 
    phone?: string; 
    converted_at?: string;
    converted_customer_id?: string;
    converting?: boolean;
  };

  try {
    lead = await databases.getDocument(dbId, collLeads, leadId) as unknown as typeof lead;
  } catch {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // 1. Idempotency Check: Already converted
  if (lead.converted_customer_id) {
    try {
      const existingCustomer = await databases.getDocument(dbId, collCustomers, lead.converted_customer_id) as any;
      return NextResponse.json({
        id: existingCustomer.$id,
        leadId,
        name: existingCustomer.name,
        email: existingCustomer.email,
        phone: existingCustomer.phone,
        company: existingCustomer.company,
        notes: existingCustomer.notes,
        message: "Lead already converted",
      });
    } catch {
      // Customer not found but ID exists on lead? Proceed to re-create or error?
      // Let's assume data inconsistency and allow re-creation or just error.
      // For safety, let's error.
      return NextResponse.json({ error: "Customer record missing for converted lead" }, { status: 500 });
    }
  }

  // 2. Race Condition Check: Locking
  if (lead.converting) {
    return NextResponse.json({ error: "Conversion in progress" }, { status: 409 });
  }

  // 3. Set Lock
  try {
    await databases.updateDocument(dbId, collLeads, leadId, {
      converting: true,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to lock lead for conversion" }, { status: 500 });
  }

  try {
    // 4. Create Customer
    // Check if customer with same email exists? (Optional, but good practice)
    const existingCustomers = await databases.listDocuments(dbId, collCustomers, [
      Query.equal("email", lead.email),
      Query.limit(1),
    ]);

    let customerDoc;
    if (existingCustomers.documents.length > 0) {
      // Use existing customer? Or create new?
      // For now, let's link to existing if found by email?
      // But lead conversion usually means creating a NEW customer record linked to this lead.
      // If we link to existing, we might overwrite data.
      // Let's create new for now as per original logic, assuming email uniqueness isn't enforced strictly or handled elsewhere.
      // Actually, original logic didn't check email.
      customerDoc = await databases.createDocument(dbId, collCustomers, ID.unique(), {
        lead_id: leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? "",
        company: "",
        notes: "",
        created_at: new Date().toISOString(),
        created_by: user.$id,
        deleted_at: "", // Empty string for not deleted
      });
    } else {
      customerDoc = await databases.createDocument(dbId, collCustomers, ID.unique(), {
        lead_id: leadId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone ?? "",
        company: "",
        notes: "",
        created_at: new Date().toISOString(),
        created_by: user.$id,
        deleted_at: "",
      });
    }

    // 5. Update Lead (Unlock + Set IDs)
    await databases.updateDocument(dbId, collLeads, leadId, {
      converting: false,
      converted_at: new Date().toISOString(),
      converted_customer_id: customerDoc.$id,
    });

    // 6. Audit Log
    await auditLog({
      userId: user.$id,
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

  } catch (error) {
    // Rollback Lock
    await databases.updateDocument(dbId, collLeads, leadId, {
      converting: false,
    }).catch(() => {});
    
    console.error("Conversion error:", error);
    return NextResponse.json({ error: "Conversion failed" }, { status: 500 });
  }
}
