"use client";

import { useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";
import { AlertCircle } from "lucide-react";

type Sub = {
  id: string;
  nextPaymentDate: string;
  status: string;
  amount: unknown;
  customer?: { name: string };
};

export function SubscriptionAlerts() {
  const [subs, setSubs] = useState<Sub[]>([]);

  useEffect(() => {
    fetch("/api/subscriptions?upcoming=7")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSubs);
  }, []);

  const upcoming = subs.filter((s) => {
    const d = new Date(s.nextPaymentDate);
    const days = differenceInDays(d, new Date());
    return days >= 0 && days <= 7;
  });

  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        Yaklaşan ödeme günleri (7 gün)
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
        {upcoming.map((s) => (
          <li key={s.id}>
            {s.customer?.name ?? "Müşteri"} – {format(new Date(s.nextPaymentDate), "d MMM yyyy", { locale: tr })} –{" "}
            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(s.amount))}
          </li>
        ))}
      </ul>
    </div>
  );
}
