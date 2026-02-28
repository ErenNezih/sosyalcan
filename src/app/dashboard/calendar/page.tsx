"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Calendar, CheckSquare, CreditCard, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { CalendarDayEvents } from "@/components/calendar/calendar-day-events";
import { AppointmentForm } from "@/components/calendar/appointment-form";
import { TaskForm } from "@/components/todo/task-form";

export type CalendarEventItem =
  | { kind: "appointment"; id: string; title: string; start: string; end: string; type: string; assignee?: string | null }
  | { kind: "task"; id: string; title: string; start: string; end: string; status: string; assignee?: string | null; assigneeEmail?: string | null }
  | { kind: "shoot"; id: string; title: string; start: string; end: string; shootType?: string; assignee?: string | null; status?: string };

type CalendarApiEvent = {
  id: string;
  source: "task" | "appointment" | "shoot";
  title: string;
  start_at: string;
  end_at: string;
  type: string;
  assignee?: string | null;
  assigneeEmail?: string | null;
  shootType?: string;
  status?: string;
};

export default function CalendarPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    assigneeId: string | null;
    urgency: string;
    dueDate: string | null;
    assignee: { id: string; name: string | null } | null;
  } | null>(null);
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set(["crm", "todo"]));

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  function loadEvents() {
    const from = start.toISOString();
    const to = end.toISOString();
    const types = Array.from(filterTypes).join(",") || "crm,todo";
    fetch(`/api/calendar?from=${from}&to=${to}&types=${types}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((data: { events: CalendarApiEvent[] }) => {
        const mapped: CalendarEventItem[] = (data.events || []).map((e) => {
          if (e.source === "task") {
            return {
              kind: "task" as const,
              id: e.id,
              title: e.title,
              start: e.start_at,
              end: e.end_at,
              status: "todo",
              assignee: e.assignee ?? "—",
              assigneeEmail: e.assigneeEmail,
            };
          }
          if (e.source === "shoot") {
            return {
              kind: "shoot" as const,
              id: e.id,
              title: e.title,
              start: e.start_at,
              end: e.end_at,
              shootType: e.shootType,
              assignee: e.assignee ?? null,
              status: e.status,
            };
          }
          return {
            kind: "appointment" as const,
            id: e.id,
            title: e.title,
            start: e.start_at,
            end: e.end_at,
            type: e.type,
            assignee: e.assignee,
          };
        });
        setEvents(mapped);
      });
  }

  useEffect(() => {
    loadEvents();
  }, [current, filterTypes]);

  useEffect(() => {
    if (!editingTaskId) {
      setEditingTask(null);
      return;
    }
    fetch(`/api/tasks/${editingTaskId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setEditingTask);
  }, [editingTaskId]);

  const getEventsForDay = (day: Date) =>
    events.filter((e) => isSameDay(new Date(e.start), day));

  function toggleFilter(type: string) {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      if (next.size === 0) next.add("crm");
      return next;
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Takvim & Randevular</h1>
          <p className="text-muted-foreground">CRM, To-Do ve Finans tek takvimde</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg border border-white/10 p-1">
            {[
              { id: "crm", label: "CRM", icon: Calendar },
              { id: "todo", label: "To-Do", icon: CheckSquare },
              { id: "shoot", label: "Çekimler", icon: Video },
              { id: "finance", label: "Finans", icon: CreditCard },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={filterTypes.has(id) ? "secondary" : "ghost"}
                size="sm"
                onClick={() => toggleFilter(id)}
                className="gap-1"
              >
                <Icon className="h-3 w-3" />
                {label}
              </Button>
            ))}
          </div>
          <Button onClick={() => { setEditingAppointmentId(null); setFormOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Randevu Ekle
          </Button>
        </div>
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
            const dayEvents = getEventsForDay(day);
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
                  {dayEvents.slice(0, 2).map((e) => (
                    <div
                      key={e.kind + e.id}
                      className={`truncate rounded px-1 py-0.5 text-xs ${
                        e.kind === "task"
                          ? "bg-amber-500/20 text-amber-400"
                          : e.kind === "shoot"
                            ? "bg-violet-500/20 text-violet-400"
                            : "bg-primary/20 text-primary"
                      }`}
                      title={
                        e.kind === "task" && e.assignee
                          ? `(${e.assignee}) ${e.title}`
                          : e.kind === "shoot" && e.assignee
                            ? `(${e.assignee}) ${e.title}`
                            : e.title
                      }
                    >
                      {e.kind === "task" && e.assignee && e.assignee !== "—"
                        ? `(${e.assignee}) ${e.title}`
                        : e.kind === "shoot" && e.assignee
                          ? `(${e.assignee}) ${e.title}`
                          : e.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-xs text-muted-foreground">+{dayEvents.length - 2}</span>
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
            onEditAppointment={(id) => {
              setEditingAppointmentId(id);
              setFormOpen(true);
              setSelectedDate(null);
            }}
            onEditTask={(id) => {
              setEditingTaskId(id);
              setSelectedDate(null);
            }}
            onEditShoot={(id) => {
              router.push(`/dashboard/projects/${id}`);
              setSelectedDate(null);
            }}
            onDeleted={loadEvents}
          />
        )}
      </SlideOver>

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingAppointmentId(null); }}
        title={editingAppointmentId ? "Randevu Düzenle" : "Yeni Randevu"}
      >
        <AppointmentForm
          appointmentId={editingAppointmentId}
          defaultDate={selectedDate ?? new Date()}
          onSuccess={() => {
            setFormOpen(false);
            setEditingAppointmentId(null);
            loadEvents();
          }}
          onCancel={() => { setFormOpen(false); setEditingAppointmentId(null); }}
        />
      </SlideOver>

      <SlideOver
        open={!!editingTaskId}
        onClose={() => { setEditingTaskId(null); setEditingTask(null); }}
        title="Görev Düzenle"
      >
        {editingTaskId && (
          <TaskForm
            taskId={editingTaskId}
            task={editingTask}
            defaultDueDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined}
            onSuccess={() => {
              setEditingTaskId(null);
              setEditingTask(null);
              loadEvents();
            }}
            onCancel={() => { setEditingTaskId(null); setEditingTask(null); }}
          />
        )}
      </SlideOver>
    </div>
  );
}
