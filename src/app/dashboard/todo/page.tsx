"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import { Plus, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlideOver } from "@/components/ui/slide-over";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/todo/kanban-board";
import { TaskForm } from "@/components/todo/task-form";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  urgency: string;
  dueDate: string | null;
  order: number;
  assignee: { id: string; name: string | null } | null;
};

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () =>
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []));

  useEffect(() => {
    load();
  }, []);

  const tasksByDate = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

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

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <List className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Tarihli liste
          </TabsTrigger>
        </TabsList>
        <TabsContent value="kanban">
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
            />
          </motion.div>
        </TabsContent>
        <TabsContent value="timeline">
          <div className="rounded-lg border border-white/10 overflow-hidden">
            <p className="border-b border-white/10 px-4 py-2 text-sm text-muted-foreground">
              Tüm görevler teslim tarihine göre. Tarihi olmayanlar en sonda. Takvimde bu tarihlerde görünür.
            </p>
            <ul className="divide-y divide-white/5">
              {tasksByDate.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/5"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.status} · {t.assignee?.name ?? "Atanmadı"}
                      {t.dueDate && (
                        <> · {format(new Date(t.dueDate), "d MMM yyyy HH:mm", { locale: tr })}</>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(t.id); setFormOpen(true); }}>
                    Düzenle
                  </Button>
                </li>
              ))}
            </ul>
            {tasks.length === 0 && (
              <p className="p-6 text-center text-muted-foreground">Henüz görev yok.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SlideOver
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingId(null); }}
        title={editingId ? "Görev Düzenle" : "Yeni Görev"}
      >
        <TaskForm
          taskId={editingId}
          task={editingId ? tasks.find((t) => t.id === editingId) ?? null : null}
          onSuccess={() => { load(); setFormOpen(false); setEditingId(null); }}
          onCancel={() => { setFormOpen(false); setEditingId(null); }}
        />
      </SlideOver>
    </div>
  );
}
