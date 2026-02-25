"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  contactPulse?: "green" | "yellow" | "red";
  daysSinceContact?: number | null;
};

export function ContactAlertsWidget() {
  const [red, setRed] = useState<Customer[]>([]);

  useEffect(() => {
    fetch("/api/customers?withContactStatus=1")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setRed(list.filter((c: Customer) => c.contactPulse === "red"));
      });
  }, []);

  if (red.length === 0) return null;

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">
          Temas uyarısı
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm">
          {red.slice(0, 3).map((c) => (
            <li key={c.id}>
              <Link href="/dashboard/customers" className="text-primary hover:underline">
                {c.name}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                ile {c.daysSinceContact ?? 0} gündür temas kurulmadı. Bir çay içmeye gidin.
              </span>
            </li>
          ))}
        </ul>
        {red.length > 3 && (
          <Link
            href="/dashboard/temas"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            Tümünü gör ({red.length})
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
