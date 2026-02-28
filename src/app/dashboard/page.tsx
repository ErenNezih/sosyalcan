"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/fade-in";
import { TrendingUp, Calendar, CheckSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

type Summary = {
  netRevenueKurus: number;
  tasksDueSoon: Array<{ id: string; title: string; dueAt: string | null; status: string }>;
  appointmentsToday: Array<{ id: string; title: string; startAt: string; endAt: string }>;
  overdueTasks: Array<{ id: string; title: string; dueAt: string | null; status: string }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data?.ok ? setSummary(data.data) : setSummary(null));
  }, []);

  const netRevenue = summary ? summary.netRevenueKurus / 100 : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Kokpit</h1>
        <p className="text-muted-foreground">Özet ve yaklaşan görevler</p>
      </div>

      <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Net Ciro</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <p className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(netRevenue)}
              </p>
            ) : (
              <Skeleton className="h-8 w-32" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bugünün Randevuları</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <p className="text-2xl font-bold">{summary.appointmentsToday.length}</p>
            ) : (
              <Skeleton className="h-8 w-12" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Yaklaşan Görevler</CardTitle>
            <CheckSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <p className="text-2xl font-bold">{summary.tasksDueSoon.length}</p>
            ) : (
              <Skeleton className="h-8 w-12" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Geciken Görevler</CardTitle>
            <AlertCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <p className="text-2xl font-bold">{summary.overdueTasks.length}</p>
            ) : (
              <Skeleton className="h-8 w-12" />
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {summary && (summary.tasksDueSoon.length > 0 || summary.overdueTasks.length > 0 || summary.appointmentsToday.length > 0) && (
        <FadeIn as="section" delay={0.05} className="space-y-4">
          <h2 className="text-lg font-semibold">Yaklaşanlar & Bugün</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.overdueTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Geciken Görevler</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {summary.overdueTasks.slice(0, 5).map((t) => (
                      <li key={t.id}>
                        <Link href={`/dashboard/todo?task=${t.id}`} className="text-primary hover:underline">
                          {t.title}
                        </Link>
                        {t.dueAt && (
                          <span className="ml-2 text-muted-foreground">
                            {format(new Date(t.dueAt), "d MMM", { locale: tr })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {summary.tasksDueSoon.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Yaklaşan Görevler</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {summary.tasksDueSoon.slice(0, 5).map((t) => (
                      <li key={t.id}>
                        <Link href={`/dashboard/todo?task=${t.id}`} className="text-primary hover:underline">
                          {t.title}
                        </Link>
                        {t.dueAt && (
                          <span className="ml-2 text-muted-foreground">
                            {format(new Date(t.dueAt), "d MMM", { locale: tr })}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {summary.appointmentsToday.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Bugünün Randevuları</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {summary.appointmentsToday.slice(0, 5).map((a) => (
                      <li key={a.id}>
                        <Link href="/dashboard/calendar" className="text-primary hover:underline">
                          {a.title}
                        </Link>
                        <span className="ml-2 text-muted-foreground">
                          {format(new Date(a.startAt), "HH:mm", { locale: tr })}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
