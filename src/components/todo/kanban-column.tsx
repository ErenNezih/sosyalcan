"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";

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

export function KanbanColumn({
  id,
  title,
  tasks,
  onEdit,
  onMove,
}: {
  id: string;
  title: string;
  tasks: Task[];
  onEdit: (taskId: string) => void;
  onMove: (taskId: string, status: string, order: number) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border border-white/10 bg-white/5 p-4 min-h-[320px] transition-colors ${
        isOver ? "ring-2 ring-primary/50" : ""
      }`}
    >
      <h3 className="mb-4 font-semibold text-foreground">{title}</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onEdit={() => onEdit(task.id)}
            isDrag={false}
          />
        ))}
      </div>
    </div>
  );
}
