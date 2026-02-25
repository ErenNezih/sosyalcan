"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";

type CustomerContact = {
  id: string;
  name: string;
  email: string;
  lastContactAt: string | null;
  daysSinceContact: number | null;
  contactPulse: "green" | "yellow" | "red";
};

export default function TemasPage() {
  const [customers, setCustomers] = useState<CustomerContact[]>([]);

  useEffect(() => {
    fetch("/api/customers?withContactStatus=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const withContact = list.filter((c: CustomerContact) => c.lastContactAt != null);
        withContact.sort((a: CustomerContact, b: CustomerContact) => {
          const da = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0;
          const db = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0;
          return db - da;
        });
        setCustomers(withContact);
      });
  }, []);

  const red = customers.filter((c) => c.contactPulse === "red");
  const yellow = customers.filter((c) => c.contactPulse === "yellow");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Temas & Ziyaretler</h1>
        <p className="text-muted-foreground">Randevu geçmişine göre ziyaret ettiğiniz müşteriler</p>
      </div>

      {(red.length > 0 || yellow.length > 0) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="mb-2 font-medium text-amber-600 dark:text-amber-400">Temas uyarıları</h2>
          <ul className="space-y-1 text-sm">
            {red.map((c) => (
              <li key={c.id}>
                <Link href="/dashboard/customers" className="text-primary hover:underline">
                  {c.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  – {c.daysSinceContact ?? 0} gündür temas kurulmadı. Bir çay içmeye gidin.
                </span>
              </li>
            ))}
            {yellow.map((c) => (
              <li key={c.id}>
                <Link href="/dashboard/customers" className="text-primary hover:underline">
                  {c.name}
                </Link>
                <span className="text-muted-foreground">
                  {" "}
                  – {c.daysSinceContact ?? 0} gündür temas yok.
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-medium">
          <CalendarCheck className="h-4 w-4 text-primary" />
          Ziyaret edilen müşteriler (son temas tarihine göre)
        </div>
        {customers.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            Henüz takvimde müşteri randevusu yok. Randevu eklerken &quot;Kiminle&quot; alanından müşteri seçin.
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {customers.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      c.contactPulse === "green"
                        ? "bg-emerald-500"
                        : c.contactPulse === "yellow"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">
                    Son temas: {c.lastContactAt ? format(new Date(c.lastContactAt), "d MMM yyyy", { locale: tr }) : "—"}
                  </p>
                  {c.daysSinceContact != null && (
                    <p className={c.contactPulse === "red" ? "text-red-400" : c.contactPulse === "yellow" ? "text-amber-400" : ""}>
                      {c.daysSinceContact} gün önce
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
