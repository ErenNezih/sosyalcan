"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, CheckSquare } from "lucide-react";

export type CalendarEventItem =
  | { kind: "appointment"; id: string; title: string; start: string; end: string; type: string }
  | { kind: "task"; id: string; title: string; start: string; end: string; status: string; assignee: string };

export function CalendarDayEvents({
  date: _date,
  events,
  onEdit,
  onDeleted,
}: {
  date: Date;
  events: CalendarEventItem[];
  onEdit: (appointmentId: string) => void;
  onDeleted: () => void;
}) {
  if (events.length === 0) {
    return <p className="text-muted-foreground">Bu gün için randevu veya görev yok.</p>;
  }

  return (
    <ul className="space-y-3">
      {events.map((ev) => (
        <li key={ev.kind + ev.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
          <div>
            <p className="font-medium">{ev.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(ev.start).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
              {" – "}
              {new Date(ev.end).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {ev.kind === "appointment" && (
              <p className="text-xs text-muted-foreground capitalize">{ev.type}</p>
            )}
            {ev.kind === "task" && (
              <p className="text-xs text-muted-foreground">
                Görev · {ev.status} · {ev.assignee}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {ev.kind === "appointment" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEdit(ev.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await fetch(`/api/appointments/${ev.id}`, { method: "DELETE" });
                    onDeleted();
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            {ev.kind === "task" && (
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href="/dashboard/todo">
                  <CheckSquare className="h-3 w-3" />
                  Görevi Aç
                </Link>
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
