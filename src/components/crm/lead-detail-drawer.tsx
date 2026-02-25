"use client";

import { useState } from "react";
import type { Lead } from "@prisma/client";
import { SlideOver } from "@/components/ui/slide-over";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export function LeadDetailDrawer({
  lead,
  open,
  onClose,
  onConverted,
}: {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  async function convert() {
    if (!lead?.id || lead.convertedAt) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/convert`, { method: "POST" });
      if (res.ok) onConverted();
    } finally {
      setLoading(false);
    }
  }

  if (!lead) return null;

  return (
    <SlideOver open={open} onClose={onClose} title={lead.name}>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">E-posta</p>
          <p className="font-medium">{lead.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Telefon</p>
          <p className="font-medium">{lead.phone ?? "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Sektör</p>
          <p className="font-medium">{lead.sector ?? "-"}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Bütçe</p>
          <p className="font-medium">{lead.budget ?? "-"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">Özel soru yanıtı</p>
          <p className="mt-1 text-sm">{lead.customQuestionAnswer ?? "-"}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm text-muted-foreground">Kayıt tarihi</p>
          <p className="font-medium">{format(lead.createdAt, "d MMMM yyyy, HH:mm", { locale: tr })}</p>
        </div>
      </div>
      {!lead.convertedAt && (
        <div className="mt-8 flex justify-end">
          <Button onClick={convert} disabled={loading} className="bg-primary text-primary-foreground">
            {loading ? "İşleniyor..." : "Müşteriye Çevir"}
          </Button>
        </div>
      )}
    </SlideOver>
  );
}
