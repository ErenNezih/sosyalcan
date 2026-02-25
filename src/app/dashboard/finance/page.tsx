"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { TransactionForm } from "@/components/finance/transaction-form";
import { DonutChart } from "@/components/finance/donut-chart";
import { BalanceCards } from "@/components/finance/balance-cards";
import { SubscriptionDueList } from "@/components/finance/subscription-due-list";

type Balance = {
  id: string;
  bucket: string;
  balance: string;
  userId: string | null;
  user: { id: string; name: string | null } | null;
};

export default function FinancePage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadBalances = () =>
    fetch("/api/balances")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          toast.error(typeof data?.error === "string" ? data.error : "Bakiyeler yüklenemedi");
          return [];
        }
        return Array.isArray(data) ? data : [];
      })
      .then(setBalances);

  useEffect(() => {
    loadBalances();
  }, []);

  const onTransactionSuccess = () => {
    loadBalances();
    setFormOpen(false);
    setRefreshTrigger((t) => t + 1);
  };

  const safeBalances = Array.isArray(balances) ? balances : [];
  const donutData = safeBalances.map((b) => ({
    name: b.bucket === "EREN" ? "Eren" : b.bucket === "KERIM" ? "Kerim" : b.bucket === "GIDER" ? "Gider" : b.bucket === "BIRIKIM" ? "Birikim" : "Acil Durum",
    value: Number(b.balance),
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finans & Ön Muhasebe</h1>
          <p className="text-muted-foreground">Gelir / Gider ve sabit dağılım (30-30-15-15-10)</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          İşlem Ekle
        </Button>
      </div>

      <SubscriptionDueList onCollected={loadBalances} refreshTrigger={refreshTrigger} />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-6 lg:grid-cols-2"
      >
        <div className="glass-card p-6">
          <h2 className="mb-4 font-semibold">Bakiye Dağılımı</h2>
          <DonutChart data={donutData} />
        </div>
        <div>
          <h2 className="mb-4 font-semibold">Bakiyeler</h2>
          <BalanceCards balances={safeBalances} />
        </div>
      </motion.div>

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="Gelir / Gider">
        <TransactionForm
          onSuccess={onTransactionSuccess}
          onCancel={() => setFormOpen(false)}
        />
      </SlideOver>
    </div>
  );
}
