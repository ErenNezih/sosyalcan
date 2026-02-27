"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  Wallet,
  FileText,
  Settings,
  CalendarCheck,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Kokpit", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projeler", icon: Briefcase },
  { href: "/dashboard/customers", label: "Müşteriler", icon: Users },
  { href: "/dashboard/temas", label: "Temas", icon: CalendarCheck },
  { href: "/dashboard/calendar", label: "Takvim", icon: Calendar },
  { href: "/dashboard/todo", label: "To-Do", icon: CheckSquare },
  { href: "/dashboard/finance", label: "Finans", icon: Wallet },
  { href: "/dashboard/blog", label: "Blog & SEO", icon: FileText },
  { href: "/dashboard/settings", label: "Ayarlar", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {nav.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-white/10 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
