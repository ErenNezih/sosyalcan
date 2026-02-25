"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { CalendarDayEvents } from "@/components/calendar/calendar-day-events";
import { AppointmentForm } from "@/components/calendar/appointment-form";

type Appointment = {
  id: string;
  title: string;
  description: string | null;
  start: string;
  end: string;
  type: string;
  relatedId: string | null;
  relatedType: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  assignee: { name: string | null } | null;
};

export type CalendarEvent =
  | { kind: "appointment"; id: string; title: string; start: string; end: string; type: string }
  | { kind: "task"; id: string; title: string; start: string; end: string; status: string; assignee: string };

export default function CalendarPage() {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  function loadEvents() {
    const from = start.toISOString();
    const to = end.toISOString();
    Promise.all([
      fetch(`/api/appointments?from=${from}&to=${to}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/tasks?from=${from}&to=${to}`).then((r) => (r.ok ? r.json() : [])),
    ]).then(([appointments, tasks]: [Appointment[], Task[]]) => {
      const appointmentEvents: CalendarEvent[] = (appointments || []).map((a) => ({
        kind: "appointment" as const,
        id: a.id,
        title: a.title,
        start: a.start,
        end: a.end,
        type: a.type,
      }));
      const taskEvents: CalendarEvent[] = (tasks || [])
        .filter((t) => t.dueDate)
        .map((t) => {
          const d = new Date(t.dueDate!);
          d.setHours(9, 0, 0, 0);
          const endD = new Date(d);
          endD.setHours(10, 0, 0, 0);
          return {
            kind: "task" as const,
            id: t.id,
            title: t.title,
            start: d.toISOString(),
            end: endD.toISOString(),
            status: t.status,
            assignee: t.assignee?.name ?? "—",
          };
        });
      setEvents([...appointmentEvents, ...taskEvents]);
    });
  }

  useEffect(() => {
    loadEvents();
  }, [current]);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start), day));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Takvim & Randevular</h1>
          <p className="text-muted-foreground">CRM, To-Do ve Finans tek takvimde</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Randevu Ekle
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => setCurrent(subMonths(current, 1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">
            {format(current, "MMMM yyyy", { locale: tr })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrent(addMonths(current, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="grid grid-cols-7 text-center text-sm">
          {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
            <div key={d} className="border-b border-white/10 py-2 font-medium text-muted-foreground">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const events = getEventsForDay(day);
            const inMonth = isSameMonth(day, current);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`min-h-24 border-b border-r border-white/5 p-1 text-left ${
                  inMonth ? "text-foreground" : "text-muted-foreground/60"
                } ${today ? "bg-primary/10" : ""}`}
              >
                <span className="text-sm font-medium">{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {events.slice(0, 2).map((e) => (
                    <div
                      key={e.kind + e.id}
                      className={`truncate rounded px-1 py-0.5 text-xs ${
                        e.kind === "task" ? "bg-amber-500/20 text-amber-400" : "bg-primary/20 text-primary"
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{events.length - 2}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <SlideOver
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? format(selectedDate, "d MMMM yyyy", { locale: tr }) : ""}
      >
        {selectedDate && (
          <CalendarDayEvents
            date={selectedDate}
            events={getEventsForDay(selectedDate)}
            onEdit={(id) => { setEditingId(id); setFormOpen(true); setSelectedDate(null); }}
            onDeleted={() => {
              setSelectedDate(null);
              loadEvents();
            }}
          />
        )}
      </SlideOver>

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        title={editingId ? "Randevu Düzenle" : "Yeni Randevu"}
      >
        <AppointmentForm
          appointmentId={editingId}
          defaultDate={selectedDate ?? new Date()}
          onSuccess={() => {
            setFormOpen(false);
            setEditingId(null);
            loadEvents();
          }}
          onCancel={() => { setFormOpen(false); setEditingId(null); }}
        />
      </SlideOver>
    </div>
  );
}
