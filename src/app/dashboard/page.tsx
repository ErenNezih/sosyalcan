import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { getAppwriteAdmin, APPWRITE } from "@/lib/appwrite/server";
import { Query } from "@/lib/appwrite/helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/fade-in";
import { Suspense } from "react";
import { TrendingUp, Users, Calendar, CreditCard } from "lucide-react";
import { LeadStreamTable } from "@/components/dashboard/lead-stream-table";
import { ContactAlertsWidget } from "@/components/dashboard/contact-alerts-widget";

const dbId = APPWRITE.databaseId;

async function WidgetMonthlyRevenue() {
  try {
    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();
    const { databases } = getAppwriteAdmin();
    const [incomeRes, expenseRes] = await Promise.all([
      databases.listDocuments(dbId, APPWRITE.collections.transactions, [
        Query.equal("type", "income"),
        Query.greaterThanEqual("date", start),
        Query.lessThanEqual("date", end),
      ]),
      databases.listDocuments(dbId, APPWRITE.collections.transactions, [
        Query.equal("type", "expense"),
        Query.greaterThanEqual("date", start),
        Query.lessThanEqual("date", end),
      ]),
    ]);
    let incomeSum = 0;
    let expenseSum = 0;
    for (const d of incomeRes.documents) incomeSum += Number((d as unknown as { amount?: number }).amount ?? 0);
    for (const d of expenseRes.documents) expenseSum += Number((d as unknown as { amount?: number }).amount ?? 0);
    const net = incomeSum - expenseSum;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aylık Net Ciro
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">
            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(net)}
          </p>
        </CardContent>
      </Card>
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR WidgetMonthlyRevenue:", error);
    }
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Aylık Net Ciro</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        </CardContent>
      </Card>
    );
  }
}

async function WidgetNewLeads() {
  try {
    const { databases } = getAppwriteAdmin();
    const res = await databases.listDocuments(dbId, APPWRITE.collections.leads, [
      Query.isNull("converted_at"),
      Query.limit(1),
    ]);
    const count = res.total;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Yeni Potansiyeller
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{count}</p>
        </CardContent>
      </Card>
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR WidgetNewLeads:", error);
    }
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Yeni Potansiyeller</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        </CardContent>
      </Card>
    );
  }
}

async function WidgetTodayAppointments() {
  try {
    const start = startOfDay(new Date()).toISOString();
    const end = endOfDay(new Date()).toISOString();
    const { databases } = getAppwriteAdmin();
    const res = await databases.listDocuments(dbId, APPWRITE.collections.appointments, [
      Query.greaterThanEqual("start", start),
      Query.lessThanEqual("start", end),
      Query.limit(1),
    ]);
    const count = res.total;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Bugünün Randevuları
          </CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{count}</p>
        </CardContent>
      </Card>
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR WidgetTodayAppointments:", error);
    }
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bugünün Randevuları</CardTitle>
          <Calendar className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        </CardContent>
      </Card>
    );
  }
}

async function WidgetActiveSubscriptions() {
  try {
    const { databases } = getAppwriteAdmin();
    const res = await databases.listDocuments(dbId, APPWRITE.collections.subscriptions, [
      Query.equal("status", "active"),
      Query.limit(1),
    ]);
    const count = res.total;
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Aktif Abonelikler
          </CardTitle>
          <CreditCard className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{count}</p>
        </CardContent>
      </Card>
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR WidgetActiveSubscriptions:", error);
    }
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Aktif Abonelikler</CardTitle>
          <CreditCard className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
        </CardContent>
      </Card>
    );
  }
}

function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Kokpit</h1>
        <p className="text-muted-foreground">Özet ve canlı akış</p>
      </div>

      <FadeIn className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<WidgetSkeleton />}>
          <WidgetMonthlyRevenue />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <WidgetNewLeads />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <WidgetTodayAppointments />
        </Suspense>
        <Suspense fallback={<WidgetSkeleton />}>
          <WidgetActiveSubscriptions />
        </Suspense>
      </FadeIn>

      <FadeIn as="section" delay={0.05}>
        <ContactAlertsWidget />
      </FadeIn>

      <FadeIn as="section" delay={0.1}>
        <h2 className="mb-4 text-lg font-semibold">Vitrin etkileşimleri (canlı akış)</h2>
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LeadStreamTable />
        </Suspense>
      </FadeIn>
    </div>
  );
}
