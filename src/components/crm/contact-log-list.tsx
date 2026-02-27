"use client";

import { ContactLog } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Phone, MessageCircle, Mail, Users, Instagram, MoreHorizontal } from "lucide-react";

interface ContactLogListProps {
  logs: ContactLog[];
}

export function ContactLogList({ logs }: ContactLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-8">
        Henüz iletişim kaydı yok.
      </div>
    );
  }

  const iconMap: Record<string, any> = {
    phone: Phone,
    whatsapp: MessageCircle,
    email: Mail,
    meeting: Users,
    instagram: Instagram,
    other: MoreHorizontal,
  };

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const Icon = iconMap[log.channel] || MoreHorizontal;
        return (
          <div key={log.id} className="flex gap-4 rounded-lg border border-white/10 bg-card/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium capitalize">{log.channel}</p>
                <span className="text-xs text-muted-foreground">
                  {log.createdAt ? format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: tr }) : "-"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{log.summary}</p>
              {log.nextFollowUpAt && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                  <span>Sonraki Takip: {format(new Date(log.nextFollowUpAt), "d MMM yyyy, HH:mm", { locale: tr })}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
