"use client";

import { Deliverable } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Clock, AlertCircle, FileText, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface DeliverableListProps {
  deliverables: Deliverable[];
  onRefresh: () => void;
}

export function DeliverableList({ deliverables, onRefresh }: DeliverableListProps) {
  if (deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 p-8 text-center">
        <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
        <h3 className="text-sm font-medium">Teslim kalemi yok</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Bu projeye henüz bir teslim kalemi eklenmemiş.
        </p>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; color: string; icon: any }> = {
    todo: { label: "Yapılacak", color: "bg-gray-500/10 text-gray-500", icon: Clock },
    in_progress: { label: "Devam Ediyor", color: "bg-blue-500/10 text-blue-500", icon: Clock },
    client_review: { label: "Müşteri Onayında", color: "bg-yellow-500/10 text-yellow-500", icon: AlertCircle },
    revision: { label: "Revize", color: "bg-orange-500/10 text-orange-500", icon: AlertCircle },
    approved: { label: "Onaylandı", color: "bg-green-500/10 text-green-500", icon: Check },
    delivered: { label: "Teslim Edildi", color: "bg-purple-500/10 text-purple-500", icon: Check },
  };

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Güncellenemedi");
      toast.success("Durum güncellendi");
      onRefresh();
    } catch (error) {
      toast.error("Hata oluştu");
    }
  }

  async function deleteDeliverable(id: string) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch(`/api/deliverables/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Silinemedi");
      toast.success("Silindi");
      onRefresh();
    } catch (error) {
      toast.error("Hata oluştu");
    }
  }

  return (
    <div className="space-y-4">
      {deliverables.map((item) => {
        const StatusIcon = statusMap[item.status]?.icon || Clock;
        return (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-card/50 p-4 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${statusMap[item.status]?.color}`}>
                <StatusIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                    {item.type}
                  </Badge>
                  {item.dueDate && (
                    <span>Due: {format(new Date(item.dueDate), "d MMM", { locale: tr })}</span>
                  )}
                  {item.revisionCount ? (
                    <span className="text-orange-400">Revize: {item.revisionCount}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={statusMap[item.status]?.color}>
                {statusMap[item.status]?.label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => updateStatus(item.id, "in_progress")}>
                    Devam Ediyor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus(item.id, "client_review")}>
                    Müşteri Onayına Gönder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus(item.id, "approved")}>
                    Onaylandı
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus(item.id, "revision")}>
                    Revize İste
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateStatus(item.id, "delivered")}>
                    Teslim Et
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => deleteDeliverable(item.id)} className="text-red-500">
                    Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
