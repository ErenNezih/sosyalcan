"use client";

import type { Customer, Lead, Subscription } from "@prisma/client";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export type CustomerWithRelations = Customer & {
  lead: Lead | null;
  subscriptions: Subscription[];
  lastContactAt?: string | null;
  daysSinceContact?: number | null;
  contactPulse?: "green" | "yellow" | "red";
};

function PulseDot({ pulse }: { pulse?: "green" | "yellow" | "red" }) {
  if (!pulse) return null;
  const color =
    pulse === "green" ? "bg-emerald-500" : pulse === "yellow" ? "bg-amber-500" : "bg-red-500";
  const title =
    pulse === "green" ? "Temas iyi" : pulse === "yellow" ? "20+ gün temas yok" : "35+ gün temas yok (risk)";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${color}`}
      title={title}
    />
  );
}

export function CustomerList({
  customers,
  onAssignPackage,
  onUpdated,
}: {
  customers: CustomerWithRelations[];
  onAssignPackage: (customerId: string) => void;
  onUpdated: () => void;
}) {
  if (customers.length === 0) {
    return (
      <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
        Henüz müşteri yok. Leads sekmesinden potansiyeli &quot;Müşteriye Çevir&quot; ile ekleyin veya &quot;Aktif Müşteri Ekle&quot; kullanın.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 font-medium w-8"></th>
            <th className="px-4 py-3 font-medium">Ad</th>
            <th className="px-4 py-3 font-medium">E-posta</th>
            <th className="px-4 py-3 font-medium">Paket</th>
            <th className="px-4 py-3 font-medium">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const activeSub = c.subscriptions.find((s) => s.status === "active");
            return (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 align-middle">
                  <PulseDot pulse={c.contactPulse} />
                </td>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">
                  {activeSub ? (
                    <span className="text-primary">
                      {activeSub.packageType} – {Number(activeSub.amount).toLocaleString("tr-TR")} TL
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Paket atanmadı</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => onAssignPackage(c.id)}
                  >
                    <CreditCard className="h-3 w-3" />
                    Paket Ata
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
