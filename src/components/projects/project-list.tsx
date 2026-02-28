"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, Briefcase } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { ArchiveRestoreDropdown } from "@/components/archive/archive-restore-dropdown";
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
        <h3 className="text-lg font-medium">Henüz proje yok</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Yeni bir proje oluşturarak başlayın.
        </p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string }> = {
    active: { label: "Aktif", color: "bg-green-500/10 text-green-500" },
    on_hold: { label: "Beklemede", color: "bg-yellow-500/10 text-yellow-500" },
    done: { label: "Tamamlandı", color: "bg-blue-500/10 text-blue-500" },
    archived: { label: "Arşivlendi", color: "bg-gray-500/10 text-gray-500" },
  };

  const priorityMap: Record<string, { label: string; color: string }> = {
    high: { label: "Yüksek", color: "text-red-500" },
    medium: { label: "Orta", color: "text-yellow-500" },
    low: { label: "Düşük", color: "text-green-500" },
  };

  async function handleArchiveRestore(id: string, isArchived: boolean) {
    if (!confirm(isArchived ? "Projeyi geri yüklemek istiyor musunuz?" : "Projeyi arşivlemek istediğinize emin misiniz?")) return;
    const url = isArchived ? `/api/projects/${id}/restore` : `/api/projects/${id}/archive`;
    try {
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, isArchived ? "Proje geri yüklenemedi" : "Proje arşivlenemedi"));
        return;
      }
      toast.success(isArchived ? "Proje geri yüklendi" : "Proje arşivlendi");
      onRefresh();
    } catch {
      toast.error("Hata oluştu");
    }
  }

  return (
    <div className="rounded-md border border-white/10 bg-card/50">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-muted-foreground">
            <th className="p-4 font-medium">Proje Adı</th>
            <th className="p-4 font-medium">Durum</th>
            <th className="p-4 font-medium">Öncelik</th>
            <th className="p-4 font-medium">Tarihler</th>
            <th className="p-4 font-medium">Bütçe</th>
            <th className="p-4 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              <td className="p-4">
                <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                  {project.name}
                </Link>
                {project.customerId && (
                  <div className="text-xs text-muted-foreground">Müşteri ID: {project.customerId.slice(0, 8)}...</div>
                )}
              </td>
              <td className="p-4">
                <Badge variant="outline" className={statusMap[project.status]?.color}>
                  {statusMap[project.status]?.label || project.status}
                </Badge>
              </td>
              <td className="p-4">
                <span className={priorityMap[project.priority || "medium"]?.color}>
                  {priorityMap[project.priority || "medium"]?.label}
                </span>
              </td>
              <td className="p-4">
                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {project.startDate && (
                    <span className="flex items-center gap-1">
                      Start: {format(new Date(project.startDate), "d MMM yyyy", { locale: tr })}
                    </span>
                  )}
                  {project.dueDate && (
                    <span className="flex items-center gap-1 text-red-400">
                      Due: {format(new Date(project.dueDate), "d MMM yyyy", { locale: tr })}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4">
                {project.budget ? new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(project.budget) : "-"}
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
                      onClick={() => handleArchiveRestore(project.id, project.status === "archived" || !!(project as { is_deleted?: boolean }).is_deleted)}
                      className={(project.status === "archived" || (project as { is_deleted?: boolean }).is_deleted) ? "" : "text-red-500"}
                    >
                      {(project.status === "archived" || (project as { is_deleted?: boolean }).is_deleted) ? (
                        <>Geri Yükle</>
                      ) : (
                        <>Arşivle</>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
