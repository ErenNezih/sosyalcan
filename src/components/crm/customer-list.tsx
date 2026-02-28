"use client";

import type { Customer, Lead, Subscription, CustomerWithRelations } from "@/types/crm";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArchiveRestoreDropdown } from "@/components/archive/archive-restore-dropdown";

export type { CustomerWithRelations };

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
  showArchived = false,
}: {
  customers: CustomerWithRelations[];
  onAssignPackage?: (customerId: string) => void;
  onUpdated: () => void;
  showArchived?: boolean;
}) {
  const hasSubs = customers.some((c) => (c.subscriptions ?? []).length > 0);

  if (customers.length === 0) {
    return (
      <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
        Henüz müşteri yok. &quot;Müşteri Ekle&quot; ile ekleyin.
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
            {hasSubs && <th className="px-4 py-3 font-medium">Paket</th>}
            {onAssignPackage && <th className="px-4 py-3 font-medium">İşlem</th>}
            <th className="px-4 py-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const subs = c.subscriptions ?? [];
            const activeSub = subs.find((s) => s.status === "active");
            const pkgType = activeSub?.packageType ?? (activeSub as { package_type?: string })?.package_type;
            return (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-3 align-middle">
                  <PulseDot pulse={c.contactPulse} />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/customers/${c.id}`} className="hover:underline font-medium">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.email}</td>
                {hasSubs && (
                  <td className="px-4 py-3">
                    {activeSub ? (
                      <span className="text-primary">
                        {pkgType ?? "-"} – {Number(activeSub.amount).toLocaleString("tr-TR")} TL
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                )}
                {onAssignPackage && (
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
                )}
                <td className="px-4 py-3">
                  <ArchiveRestoreDropdown
                    entityType="customer"
                    entityId={c.id}
                    isArchived={!!(c as { archivedAt?: string | null }).archivedAt}
                    onSuccess={onUpdated}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
