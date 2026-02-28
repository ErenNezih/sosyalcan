"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { TransactionFormSimple } from "@/components/finance/transaction-form-simple";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  dateAt: string;
  customerId: string | null;
  notes: string | null;
};

export default function FinancePage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const loadTransactions = () =>
    fetch(`/api/transactions?archived=${showArchived ? "true" : "false"}`)
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((data) => setTransactions(data.documents ?? []));

  useEffect(() => {
    loadTransactions();
  }, [showArchived]);

  const onSuccess = () => {
    loadTransactions();
    setFormOpen(false);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Finans</h1>
          <p className="text-muted-foreground">Gelir ve gider kayıtları</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          İşlem Ekle
        </Button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded text-primary"
          />
          Arşivdekileri göster
        </label>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-lg border border-white/10"
      >
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Henüz işlem yok.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Tür</th>
                <th className="px-4 py-3 font-medium">Tutar</th>
                <th className="px-4 py-3 font-medium">Not</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    {new Date(t.dateAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={t.type === "income" ? "text-emerald-400" : "text-red-400"}>
                      {t.type === "income" ? "Gelir" : "Gider"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.notes ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <SlideOver open={formOpen} onClose={() => setFormOpen(false)} title="İşlem Ekle">
        <TransactionFormSimple
          onSuccess={onSuccess}
          onCancel={() => setFormOpen(false)}
        />
      </SlideOver>
    </div>
  );
}
