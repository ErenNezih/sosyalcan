"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertCircle, CheckCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

type Sub = {
  id: string;
  nextPaymentDate: string;
  status: string;
  amount: unknown;
  planName: string | null;
  packageType: string;
  dueStatus: "yaklasıyor" | "odeme_gunu" | "gecikti" | "ok";
  remainingAmount?: unknown;
  remainingDueDate?: string | null;
  customer?: { id: string; name: string };
};

export function SubscriptionDueList({
  onCollected,
  refreshTrigger = 0,
}: {
  onCollected?: () => void;
  refreshTrigger?: number;
}) {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subscriptions?finance=1")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast.error(getApiErrorMessage(r, data, "Vadeler yüklenemedi"));
          return [];
        }
        return Array.isArray(data) ? data : [];
      })
      .then(setSubs);
  }, [refreshTrigger]);

  const canCollect = (dueStatus: string) => dueStatus === "odeme_gunu" || dueStatus === "gecikti";

  const getEffectiveDue = (s: Sub) => {
    const hasRemaining = s.remainingAmount != null && Number(s.remainingAmount) > 0;
    if (hasRemaining && s.remainingDueDate)
      return { date: s.remainingDueDate, amount: Number(s.remainingAmount), label: "Kalan" };
    return { date: s.nextPaymentDate, amount: Number(s.amount), label: "" };
  };

  async function handleDownloadProforma(sub: Sub) {
    try {
      const res = await fetch(
        `/api/invoices/proforma?subscriptionId=${sub.id}`
      );
      if (!res.ok) throw new Error("PDF oluşturulamadı");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Teklif_${(sub.customer?.name ?? "Musteri").replace(/\s+/g, "_")}_${sub.planName ?? sub.packageType}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Teklif PDF indirildi.");
    } catch {
      toast.error("Teklif PDF oluşturulamadı.");
    }
  }

  function handleCollectClick(s: Sub) {
    const effective = getEffectiveDue(s);
    const customerName = s.customer?.name ?? "Müşteri";
    const amountStr = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(effective.amount);
    const message = effective.label
      ? `${customerName} kişisinden kalan ${amountStr} ödemeyi aldığınıza emin misiniz? Onaylarsanız tutar sisteme işlenecektir.`
      : `${customerName} kişisinden ${amountStr} ödemeyi aldığınıza emin misiniz? Onaylarsanız para sisteme işlenecek ve vade ertelenecektir.`;
    if (!window.confirm(message)) return;
    doCollect(s.id);
  }

  async function doCollect(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/subscriptions/${id}/collect`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, "Tahsilat alınamadı"));
        return;
      }
      toast.success("Ödeme alındı. Vade ertelendi, dağılım uygulandı.");
      setSubs((prev) => prev.filter((s) => s.id !== id));
      onCollected?.();
    } finally {
      setLoadingId(null);
    }
  }

  if (subs.length === 0) return null;

  const badge = (dueStatus: string) => {
    if (dueStatus === "gecikti")
      return <span className="rounded px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400">Gecikti</span>;
    if (dueStatus === "odeme_gunu")
      return <span className="rounded px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400">Ödeme günü</span>;
    if (dueStatus === "yaklasıyor")
      return <span className="rounded px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-400">Yaklaşıyor</span>;
    return null;
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 font-medium text-foreground mb-3">
        <AlertCircle className="h-4 w-4 text-primary" />
        Abonelik vadeleri
      </div>
      <ul className="space-y-2">
        {subs.map((s) => {
          const effective = getEffectiveDue(s);
          const days = differenceInDays(new Date(effective.date), new Date());
          const dayLabel = days < 0 ? `${Math.abs(days)} gün gecikti` : days === 0 ? "Bugün" : `Ödemeye ${days} gün`;
          const dueStatusForRemaining = s.remainingDueDate
            ? (differenceInDays(new Date(s.remainingDueDate), new Date()) < 0
                ? "gecikti"
                : differenceInDays(new Date(s.remainingDueDate), new Date()) === 0
                  ? "odeme_gunu"
                  : differenceInDays(new Date(s.remainingDueDate), new Date()) <= 3
                    ? "yaklasıyor"
                    : "ok")
            : s.dueStatus;
          const showBadge = effective.label ? dueStatusForRemaining : s.dueStatus;
          return (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-white/5 bg-background/50 px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-medium">{s.customer?.name ?? "Müşteri"}</span>
                <span className="text-muted-foreground text-sm">
                  {s.planName ?? s.packageType}
                  {effective.label ? ` – ${effective.label} ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(effective.amount)}` : ` – ${new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(effective.amount)}`}
                </span>
                <span className="text-muted-foreground text-sm">
                  {format(new Date(effective.date), "d MMM yyyy", { locale: tr })} ({dayLabel})
                </span>
                {badge(showBadge)}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleDownloadProforma(s)}
                  title="Teklif / Proforma PDF indir"
                >
                  <FileDown className="h-3 w-3" />
                  Teklif PDF
                </Button>
                {canCollect(effective.label ? dueStatusForRemaining : s.dueStatus) && (
                  <Button
                    size="sm"
                    className="gap-1 bg-primary text-primary-foreground"
                    onClick={() => handleCollectClick(s)}
                    disabled={loadingId === s.id}
                  >
                    <CheckCircle className="h-3 w-3" />
                    {loadingId === s.id ? "İşleniyor..." : effective.label ? "Kalanı Al" : "Ödeme Alındı"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
