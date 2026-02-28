"use client";

import { useState } from "react";
import { MoreHorizontal, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

interface ArchiveRestoreDropdownProps {
  entityType: "lead" | "customer" | "project" | "deliverable" | "task" | "appointment" | "post" | "transaction" | "contact" | "subscription";
  entityId: string;
  isArchived?: boolean;
  onSuccess: () => void;
  archiveLabel?: string;
  restoreLabel?: string;
  confirmMessage?: string;
  restoreConfirmMessage?: string;
}

const ENTITY_LABELS: Record<string, { archive: string; restore: string }> = {
  lead: { archive: "Potansiyel", restore: "Potansiyel" },
  customer: { archive: "Müşteri", restore: "Müşteri" },
  project: { archive: "Proje", restore: "Proje" },
  deliverable: { archive: "Teslim kalemi", restore: "Teslim kalemi" },
  task: { archive: "Görev", restore: "Görev" },
  appointment: { archive: "Randevu", restore: "Randevu" },
  post: { archive: "Blog yazısı", restore: "Blog yazısı" },
  transaction: { archive: "İşlem", restore: "İşlem" },
  contact: { archive: "İletişim kaydı", restore: "İletişim kaydı" },
  subscription: { archive: "Abonelik", restore: "Abonelik" },
};

const API_PATHS: Record<string, string> = {
  lead: "/api/leads",
  customer: "/api/customers",
  project: "/api/projects",
  deliverable: "/api/deliverables",
  task: "/api/tasks",
  appointment: "/api/appointments",
  post: "/api/posts",
  transaction: "/api/transactions",
  contact: "/api/contacts",
  subscription: "/api/subscriptions",
};

export function ArchiveRestoreDropdown({
  entityType,
  entityId,
  isArchived = false,
  onSuccess,
  archiveLabel,
  restoreLabel,
  confirmMessage,
  restoreConfirmMessage,
}: ArchiveRestoreDropdownProps) {
  const [loading, setLoading] = useState(false);
  const labels = ENTITY_LABELS[entityType] ?? { archive: "Kayıt", restore: "Kayıt" };
  const basePath = API_PATHS[entityType];

  async function handleArchive() {
    if (!confirm(confirmMessage ?? `Bu ${labels.archive.toLowerCase()} arşivlemek istiyor musunuz?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/${entityId}/archive`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, `${labels.archive} arşivlenemedi`));
        return;
      }
      toast.success(`${labels.archive} arşivlendi`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    if (!confirm(restoreConfirmMessage ?? `Bu ${labels.restore.toLowerCase()} geri yüklemek istiyor musunuz?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/${entityId}/restore`, { method: "PATCH" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, `${labels.restore} geri yüklenemedi`));
        return;
      }
      toast.success(`${labels.restore} geri yüklendi`);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isArchived ? (
          <DropdownMenuItem onClick={handleRestore} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Geri Yükle
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleArchive} className="gap-2 text-red-500">
            <Archive className="h-4 w-4" />
            Arşivle
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
