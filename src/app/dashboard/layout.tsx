import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("DASHBOARD_SSR_ERROR layout getCurrentUser:", error);
    }
    redirect("/login?callbackUrl=/dashboard");
  }

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-30 flex h-full w-56 flex-col border-r border-white/10 bg-card/80 backdrop-blur-md">
        <div className="p-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary">Sosyalcan</span>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Komuta Merkezi</p>
        </div>
        <SidebarNav />
        <div className="border-t border-white/10 p-4">
          <p className="text-sm text-muted-foreground">{user.name ?? "Kullanıcı"}</p>
          <p className="text-xs text-muted-foreground/80">{user.email ?? "—"}</p>
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 pl-56">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-background/80 backdrop-blur-md px-8 py-4">
          <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                {(user.name ?? "?")[0]}
              </div>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
