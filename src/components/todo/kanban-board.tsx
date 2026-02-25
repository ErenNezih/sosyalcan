"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";

const COLUMNS = [
  { id: "BEKLEYEN", title: "Bekleyen" },
  { id: "KURGUDA", title: "Kurguda" },
  { id: "REVIZEDE", title: "Revizede" },
  { id: "TAMAMLANDI", title: "Tamamlandı" },
] as const;

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

export function KanbanBoard({
  tasks: tasksProp,
  onMove,
  onEdit,
}: {
  tasks: Task[];
  onMove: (taskId: string, status: string, order: number) => Promise<void>;
  onEdit: (taskId: string) => void;
}) {
  const tasks = Array.isArray(tasksProp) ? tasksProp : [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = e.active.id as string;
    const over = e.over?.id;
    if (!over || typeof over !== "string") return;
    const status = COLUMNS.find((c) => c.id === over)?.id ?? over;
    if (status && COLUMNS.some((c) => c.id === status)) {
      const sameColumn = tasks.filter((t) => t.status === status);
      const newOrder = sameColumn.length;
      await onMove(id, status, newOrder);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={tasks.filter((t) => t.status === col.id)}
            onEdit={onEdit}
            onMove={onMove}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rounded-lg border border-white/20 bg-card p-4 shadow-xl opacity-95">
            <KanbanCard task={activeTask} onEdit={() => {}} isDrag />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
