"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

type Distribution = {
  month: string;
  totalIncomeKurus: number;
  userA: { id: string; name: string; shareKurus: number } | null;
  userB: { id: string; name: string; shareKurus: number } | null;
  investmentShareKurus: number;
};

export default function DistributionPage() {
  const router = useRouter();
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    fetch(`/api/finance/distribution?month=${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => (data?.ok ? setDistribution(data.data) : setDistribution(null)));
  }, [month]);

  const fmt = (kurus: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(kurus / 100);

  const monthLabel = distribution?.month
    ? new Date(distribution.month + "-01").toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric",
      })
    : "";

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
            <h1 className="text-2xl font-semibold">Gelir Dağıtımı</h1>
            <p className="text-muted-foreground">Aylık gelir paylaşımı (A %35, B %35, Yatırım %30)</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Ay:</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
      </div>

      {distribution === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Gelir ({monthLabel})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold text-primary">
                {fmt(distribution.totalIncomeKurus)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {distribution.userA?.name ?? "Kullanıcı A"} (%35)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{fmt(distribution.userA?.shareKurus ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {distribution.userB?.name ?? "Kullanıcı B"} (%35)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{fmt(distribution.userB?.shareKurus ?? 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yatırım (%30)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{fmt(distribution.investmentShareKurus)}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
