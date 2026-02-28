"use client";

import type { Lead } from "@/types/crm";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArchiveRestoreDropdown } from "@/components/archive/archive-restore-dropdown";

export function LeadList({
  leads,
  onSelect,
  onConverted,
  showArchived = false,
}: {
  leads: Lead[];
  onSelect: (id: string) => void;
  onConverted: () => void;
  showArchived?: boolean;
}) {
  if (leads.length === 0) {
    return (
      <div className="glass-card rounded-lg p-8 text-center text-muted-foreground">
        Henüz potansiyel yok. &quot;Potansiyel Ekle&quot; ile ekleyebilirsiniz.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 font-medium">Tarih</th>
            <th className="px-4 py-3 font-medium">Ad</th>
            <th className="px-4 py-3 font-medium">E-posta</th>
            <th className="px-4 py-3 font-medium">Kaynak</th>
            <th className="px-4 py-3 font-medium">Durum</th>
            <th className="px-4 py-3 font-medium w-10"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer border-b border-white/5 hover:bg-white/5"
              onClick={() => onSelect(lead.id)}
            >
              <td className="px-4 py-3 text-muted-foreground">
                {format(lead.createdAt ?? "", "d MMM yyyy", { locale: tr })}
              </td>
              <td className="px-4 py-3">{lead.name}</td>
              <td className="px-4 py-3">{lead.email}</td>
              <td className="px-4 py-3">
                {lead.source === "vitrin" ? (
                  <span className="text-primary">Vitrin</span>
                ) : (
                  <span className="text-muted-foreground">Manuel</span>
                )}
              </td>
              <td className="px-4 py-3">
                {(lead.convertedAt ?? (lead as { converted_at?: string }).converted_at) ? (
                  <span className="text-primary">Müşteri</span>
                ) : (
                  <span className="text-muted-foreground">Potansiyel</span>
                )}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <ArchiveRestoreDropdown
                  entityType="lead"
                  entityId={lead.id}
                  isArchived={!!(lead as { is_deleted?: boolean }).is_deleted}
                  onSuccess={onConverted}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
