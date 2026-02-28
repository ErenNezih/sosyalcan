"use client";

import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

interface ProjectListProps {
  projects: Project[];
  loading: boolean;
  onRefresh: () => void;
  showArchived?: boolean;
}

export function ProjectList({ projects, loading, onRefresh }: ProjectListProps) {
  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-12 text-center">
        <Briefcase className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-medium">Henüz çekim yok</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Yeni bir çekim oluşturarak başlayın.
        </p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    planlandi: { label: "Planlandı", color: "bg-blue-500/10 text-blue-500" },
    cekimde: { label: "Çekimde", color: "bg-amber-500/10 text-amber-500" },
    kurgu: { label: "Kurgu", color: "bg-purple-500/10 text-purple-500" },
    revize: { label: "Revize", color: "bg-orange-500/10 text-orange-500" },
    teslim: { label: "Teslim", color: "bg-green-500/10 text-green-500" },
    active: { label: "Aktif", color: "bg-green-500/10 text-green-500" },
    on_hold: { label: "Beklemede", color: "bg-yellow-500/10 text-yellow-500" },
    done: { label: "Tamamlandı", color: "bg-blue-500/10 text-blue-500" },
    archived: { label: "Arşivlendi", color: "bg-gray-500/10 text-gray-500" },
  };

  const shootTypeMap: Record<string, string> = {
    video: "Video",
    drone: "Drone",
  };

  async function handleArchiveRestore(id: string, isArchived: boolean) {
    if (!confirm(isArchived ? "Çekimi geri yüklemek istiyor musunuz?" : "Çekimi arşivlemek istediğinize emin misiniz?"))
      return;
    const url = isArchived ? `/api/projects/${id}/restore` : `/api/projects/${id}/archive`;
    try {
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(
          getApiErrorMessage(res, body, isArchived ? "Çekim geri yüklenemedi" : "Çekim arşivlenemedi")
        );
        return;
      }
      toast.success(isArchived ? "Çekim geri yüklendi" : "Çekim arşivlendi");
      onRefresh();
    } catch {
      toast.error("Hata oluştu");
    }
  }

  const getDateRange = (p: Project) => {
    const start = (p as { startDate?: string | null }).startDate ?? (p as { startAt?: string | null }).startAt;
    const end = (p as { endAt?: string | null }).endAt ?? (p as { dueDate?: string | null }).dueDate;
    if (!start && !end) return "—";
    if (start && end)
      return `${format(new Date(start), "d MMM HH:mm", { locale: tr })} – ${format(new Date(end), "d MMM HH:mm", { locale: tr })}`;
    if (start) return format(new Date(start), "d MMM yyyy", { locale: tr });
    return format(new Date(end!), "d MMM yyyy", { locale: tr });
  };

  return (
    <div className="rounded-md border border-white/10 bg-card/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-muted-foreground">
            <th className="p-4 font-medium">Çekim Adı</th>
            <th className="p-4 font-medium">Tür</th>
            <th className="p-4 font-medium">Tarih-Saat</th>
            <th className="p-4 font-medium">Müşteri</th>
            <th className="p-4 font-medium">Atanan</th>
            <th className="p-4 font-medium">Durum</th>
            <th className="p-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const isArchived = !!(project as { archivedAt?: string | null }).archivedAt;
            const assignee = (project as { assignee?: { name: string } | null }).assignee;
            const shootType = (project as { shootType?: string }).shootType ?? "video";
            const customer = (project as { customer?: { name: string } }).customer;

            return (
              <tr
                key={project.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/5"
              >
                <td className="p-4">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                </td>
                <td className="p-4">{shootTypeMap[shootType] ?? shootType}</td>
                <td className="p-4 text-muted-foreground">{getDateRange(project)}</td>
                <td className="p-4 text-muted-foreground">
                  {customer?.name ?? "—"}
                </td>
                <td className="p-4 text-muted-foreground">{assignee?.name ?? "—"}</td>
                <td className="p-4">
                  <Badge variant="outline" className={statusMap[project.status]?.color}>
                    {statusMap[project.status]?.label || project.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/projects/${project.id}`}>Detaylar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchiveRestore(project.id, isArchived)}
                        className={!isArchived ? "text-red-500" : ""}
                      >
                        {isArchived ? "Geri Yükle" : "Arşivle"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
