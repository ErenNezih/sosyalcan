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

type Distribution = {
  month: string;
  totalIncomeKurus: number;
  userA: { name: string; shareKurus: number } | null;
  userB: { name: string; shareKurus: number } | null;
  investmentShareKurus: number;
};

type PaymentAlerts = {
  overdue: Array<{ id: string; customerName: string; planTitle: string; amountKurus: number }>;
  paymentWindow: Array<{ id: string; customerName: string; planTitle: string; amountKurus: number }>;
  upcoming: Array<{ id: string; customerName: string; planTitle: string; amountKurus: number }>;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [paymentAlerts, setPaymentAlerts] = useState<PaymentAlerts | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data?.ok ? setSummary(data.data) : setSummary(null)));
  }, []);

  useEffect(() => {
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    fetch(`/api/finance/distribution?month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data?.ok ? setDistribution(data.data) : setDistribution(null)));
  }, []);

  useEffect(() => {
    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    fetch(`/api/payments/alerts?month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data?.ok ? setPaymentAlerts(data.data) : setPaymentAlerts(null)));
  }, []);

  const netRevenue = summary ? summary.netRevenueKurus / 100 : 0;
  const fmt = (kurus: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(kurus / 100);

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

      {(distribution || paymentAlerts) && (
        <FadeIn as="section" delay={0.02} className="grid gap-4 md:grid-cols-2">
          {distribution && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Bu Ay Gelir Dağıtımı
                </CardTitle>
                <Link
                  href="/dashboard/finance/distribution"
                  className="text-xs text-primary hover:underline"
                >
                  Detaya git
                </Link>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {distribution.userA && (
                  <p>
                    {distribution.userA.name}: <span className="font-medium">{fmt(distribution.userA.shareKurus)}</span>
                  </p>
                )}
                {distribution.userB && (
                  <p>
                    {distribution.userB.name}: <span className="font-medium">{fmt(distribution.userB.shareKurus)}</span>
                  </p>
                )}
                <p>
                  Yatırım: <span className="font-medium">{fmt(distribution.investmentShareKurus)}</span>
                </p>
              </CardContent>
            </Card>
          )}
          {paymentAlerts && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Müşteri Ödemeleri
                </CardTitle>
                <Link
                  href="/dashboard/finance/payments"
                  className="text-xs text-primary hover:underline"
                >
                  Detaya git
                </Link>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {paymentAlerts.overdue.length > 0 ? (
                  <div>
                    <p className="font-medium text-red-400">
                      {paymentAlerts.overdue.length} ödeme gecikti
                    </p>
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {paymentAlerts.overdue.slice(0, 3).map((p) => (
                        <li key={p.id}>
                          {p.customerName} — {fmt(p.amountKurus)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : paymentAlerts.paymentWindow.length > 0 ? (
                  <p className="text-amber-400">
                    {paymentAlerts.paymentWindow.length} ödeme alma zamanı
                  </p>
                ) : paymentAlerts.upcoming.length > 0 ? (
                  <p className="text-yellow-400">
                    {paymentAlerts.upcoming.length} ödeme yaklaşıyor
                  </p>
                ) : (
                  <p className="text-muted-foreground">Bu ay ödeme uyarısı yok</p>
                )}
              </CardContent>
            </Card>
          )}
        </FadeIn>
      )}

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
