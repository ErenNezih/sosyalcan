"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api-error-message";

type Customer = { id: string; name: string };
type Plan = {
  id: string;
  customerId: string;
  customer: { id: string; name: string } | null;
  title: string;
  amountKurus: number;
  billingDay: number;
  status: string;
};

type Instance = {
  id: string;
  customerId: string;
  customer: { id: string; name: string } | null;
  planTitle: string | null;
  month: string;
  dueAt: string;
  amountKurus: number;
  status: string;
};

function getStatusBadgeClass(status: string, dueAt: string): string {
  if (status === "paid") return "bg-emerald-500/20 text-emerald-400";
  const now = new Date();
  const due = new Date(dueAt);
  const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysDiff < -1) return "bg-red-500/20 text-red-400";
  if (daysDiff >= -1 && daysDiff <= 1) return "bg-amber-500/20 text-amber-400";
  if (daysDiff <= 3) return "bg-yellow-500/20 text-yellow-400";
  return "bg-white/10 text-muted-foreground";
}

function getStatusLabel(status: string, dueAt: string): string {
  if (status === "paid") return "Alındı";
  const now = new Date();
  const due = new Date(dueAt);
  const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  if (daysDiff < -1) return "Gecikti";
  if (daysDiff === 0) return "Bugün";
  if (daysDiff === -1) return "Dün";
  if (daysDiff === 1) return "Yarın";
  if (daysDiff <= 3) return `${daysDiff} gün kala`;
  return "Bekliyor";
}

export default function PaymentsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [customerFilter, setCustomerFilter] = useState("");
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ customerId: "", title: "", amount: 0, billingDay: 15 });

  const loadPlans = () =>
    fetch(`/api/payments/plans${customerFilter ? `?customerId=${customerFilter}` : ""}`)
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((d) => (d?.ok ? setPlans(d.data) : setPlans([])));

  const loadInstances = () =>
    fetch(`/api/payments/instances?month=${month}`)
      .then((r) => (r.ok ? r.json() : { ok: false }))
      .then((d) => (d?.ok ? setInstances(d.data) : setInstances([])));

  const loadCustomers = () =>
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((arr: { id: string; name: string }[]) => setCustomers(Array.isArray(arr) ? arr : []));

  useEffect(() => {
    loadPlans();
  }, [customerFilter]);

  useEffect(() => {
    loadInstances();
    loadCustomers();
  }, [month]);

  const onSuccess = () => {
    loadPlans();
    loadInstances();
    router.refresh();
  };

  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.customerId || !planForm.title.trim()) {
      toast.error("Müşteri ve başlık gerekli");
      return;
    }
    try {
      const res = await fetch("/api/payments/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: planForm.customerId,
          title: planForm.title.trim(),
          amount: planForm.amount || 0,
          billingDay: planForm.billingDay,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(getApiErrorMessage(res, body, "Plan oluşturulamadı"));
        return;
      }
      toast.success("Ödeme planı oluşturuldu");
      setPlanFormOpen(false);
      setPlanForm({ customerId: "", title: "", amount: 0, billingDay: 15 });
      onSuccess();
    } catch {
      toast.error("Plan oluşturulamadı");
    }
  };

  const handleMarkPaid = async (instanceId: string) => {
    try {
      const res = await fetch(`/api/payments/instances/${instanceId}/mark-paid`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(getApiErrorMessage(res, body, "Ödeme işaretlenemedi"));
        return;
      }
      toast.success("Ödeme alındı olarak işaretlendi");
      onSuccess();
    } catch {
      toast.error("Ödeme işaretlenemedi");
    }
  };

  const fmt = (kurus: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/finance"
            className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Müşteri Ödemeleri</h1>
            <p className="text-muted-foreground">Düzenli ödeme planları ve takip</p>
          </div>
        </div>
        <Button onClick={() => setPlanFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Ödeme Planı
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Ay:</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Müşteri:</label>
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            <option value="">Tümü</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-lg border border-white/10"
      >
        {instances.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Bu ay için ödeme kaydı yok. Önce bir ödeme planı oluşturun.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 font-medium">Müşteri</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Vade</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium w-24">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((i) => (
                <tr key={i.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">{i.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3">{i.planTitle ?? "—"}</td>
                  <td className="px-4 py-3">
                    {new Date(i.dueAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3 font-medium">{fmt(i.amountKurus)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${getStatusBadgeClass(
                        i.status,
                        i.dueAt
                      )}`}
                    >
                      {getStatusLabel(i.status, i.dueAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {i.status !== "paid" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkPaid(i.id)}
                        className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        Ödeme Aldım
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {plans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Aktif Ödeme Planları</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {plans.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>
                    {p.customer?.name ?? "—"} — {p.title}
                  </span>
                  <span className="text-muted-foreground">
                    {fmt(p.amountKurus)} / ayın {p.billingDay}. günü
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <SlideOver open={planFormOpen} onClose={() => setPlanFormOpen(false)} title="Yeni Ödeme Planı">
        <form onSubmit={handleAddPlan} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Müşteri</label>
            <select
              value={planForm.customerId}
              onChange={(e) => setPlanForm((f) => ({ ...f, customerId: e.target.value }))}
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
              required
            >
              <option value="">Seçin</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Başlık</label>
            <input
              type="text"
              value={planForm.title}
              onChange={(e) => setPlanForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="örn: Aylık Ajans Ücreti"
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Aylık Tutar (TL)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={planForm.amount || ""}
              onChange={(e) =>
                setPlanForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
              }
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Ödeme Günü (1-28)</label>
            <input
              type="number"
              min={1}
              max={28}
              value={planForm.billingDay}
              onChange={(e) =>
                setPlanForm((f) => ({ ...f, billingDay: parseInt(e.target.value) || 15 }))
              }
              className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit">Oluştur</Button>
            <Button type="button" variant="outline" onClick={() => setPlanFormOpen(false)}>
              İptal
            </Button>
          </div>
        </form>
      </SlideOver>
    </div>
  );
}
