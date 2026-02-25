"use client";

import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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

export function KanbanCard({
  task,
  onEdit,
  isDrag,
}: {
  task: Task;
  onEdit: () => void;
  isDrag?: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: task.id,
  });

  const urgencyColor =
    task.urgency === "high" ? "bg-red-500/20 text-red-400" : task.urgency === "medium" ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-muted-foreground";

  return (
    <div
      ref={setNodeRef}
      {...(!isDrag ? { ...attributes, ...listeners } : {})}
      onClick={!isDrag ? onEdit : undefined}
      className="cursor-grab rounded-lg border border-white/10 bg-card p-3 active:cursor-grabbing hover:border-white/20"
    >
      <p className="font-medium text-foreground">{task.title}</p>
      {task.dueDate && (
        <p className="mt-1 text-xs text-muted-foreground">
          {format(new Date(task.dueDate), "d MMM", { locale: tr })}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className={`rounded px-2 py-0.5 text-xs ${urgencyColor}`}>
          {task.urgency === "high" ? "Acil" : task.urgency === "medium" ? "Orta" : "Düşük"}
        </span>
        {task.assignee && (
          <div
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
            title={task.assignee.name ?? ""}
          >
            {(task.assignee.name ?? "?")[0]}
          </div>
        )}
      </div>
    </div>
  );
}
