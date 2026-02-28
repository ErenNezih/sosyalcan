"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { KanbanBoard } from "@/components/todo/kanban-board";
import { TaskForm } from "@/components/todo/task-form";
import { DateToolbar } from "@/components/todo/date-toolbar";
import { todayString } from "@/lib/date-utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  urgency: string;
  dueDate: string | null;
  order: number;
  assignee: { id: string; name: string | null; email?: string } | null;
};

export default function TodoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dayParam = searchParams.get("day");
  const [day, setDay] = useState(dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : todayString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) && dayParam !== day) {
      setDay(dayParam);
    }
  }, [dayParam]);

  const load = () =>
    fetch(`/api/tasks?day=${day}&archived=${showArchived ? "true" : "false"}`)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []));

  useEffect(() => {
    load();
  }, [day, showArchived]);

  function handleDayChange(newDay: string) {
    setDay(newDay);
    const url = new URL(window.location.href);
    url.searchParams.set("day", newDay);
    window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">To-Do</h1>
          <p className="text-muted-foreground">Görevler takvimde de görünür; tarih atayarak planlayın</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Görev Ekle
        </Button>
      </div>

      <DateToolbar
        day={day}
        onDayChange={handleDayChange}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <KanbanBoard
          tasks={tasks}
          onMove={async (id, status, order) => {
            await fetch(`/api/tasks/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status, order }),
            });
            load();
          }}
          onEdit={(id) => { setEditingId(id); setFormOpen(true); }}
          onRefresh={load}
        />
      </motion.div>

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        title={editingId ? "Görev Düzenle" : "Yeni Görev"}
      >
        <TaskForm
          taskId={editingId}
          task={editingId ? tasks.find((t) => t.id === editingId) ?? null : null}
          defaultDueDate={day}
          onSuccess={() => { load(); setFormOpen(false); setEditingId(null); router.refresh(); }}
          onCancel={() => { setFormOpen(false); setEditingId(null); }}
        />
      </SlideOver>
    </div>
  );
}
