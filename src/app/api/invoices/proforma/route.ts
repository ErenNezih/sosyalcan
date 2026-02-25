import { NextResponse } from "next/server";
import { getSessionFromRequest, getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { jsPDF } from "jspdf";

const COMPANY_NAME = process.env.COMPANY_NAME ?? process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Sosyalcan";
const COMPANY_IBAN = process.env.COMPANY_IBAN ?? "TR00 0000 0000 0000 0000 0000 00";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session?.$id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const subscriptionId = searchParams.get("subscriptionId");
  if (!subscriptionId) {
    return NextResponse.json({ error: "subscriptionId gerekli" }, { status: 400 });
  }

  const { databases } = getAppwriteAdmin();
  const dbId = APPWRITE.databaseId;
  let subscription: { $id: string; status: string; amount: number; plan_name?: string; package_type: string; customer_id: string };
  try {
    subscription = await databases.getDocument(dbId, APPWRITE.collections.subscriptions, subscriptionId) as unknown as typeof subscription;
  } catch {
    return NextResponse.json({ error: "Abonelik bulunamadı" }, { status: 404 });
  }

  if (subscription.status !== "active") {
    return NextResponse.json({ error: "Abonelik bulunamadı" }, { status: 404 });
  }

  let customerName = "Müşteri";
  try {
    const customer = await databases.getDocument(dbId, APPWRITE.collections.customers, subscription.customer_id) as unknown as { name?: string; company?: string };
    customerName = customer?.name ?? customer?.company ?? "Müşteri";
  } catch {
    // ignore
  }

  const packageLabel = subscription.plan_name ?? subscription.package_type;
  const amount = Number(subscription.amount);
  const amountStr = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);

  const doc = new jsPDF();
  const pageW = typeof (doc as unknown as { getPageWidth?: () => number }).getPageWidth === "function"
    ? (doc as unknown as { getPageWidth: () => number }).getPageWidth()
    : 210;
  let y = 20;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, 20, y);
  y += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Teklif / Proforma", 20, y);
  y += 18;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageW - 20, y);
  y += 15;

  doc.setFont("helvetica", "bold");
  doc.text("Müşteri", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(customerName, 70, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Paket", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(packageLabel, 70, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Tutar", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(amountStr, 70, y);
  y += 18;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, y, pageW - 20, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.text("Ödeme bilgileri", 20, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`IBAN: ${COMPANY_IBAN}`, 20, y);
  y += 8;
  doc.text(`Tutar: ${amountStr}`, 20, y);
  y += 8;
  doc.text("Açıklama: " + [COMPANY_NAME, packageLabel, customerName].join(" – "), 20, y);

  const buf = Buffer.from(doc.output("arraybuffer"));
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=teklif.pdf",
    },
  });
}
