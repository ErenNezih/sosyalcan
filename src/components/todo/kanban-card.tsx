"use client";

import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ArchiveRestoreDropdown } from "@/components/archive/archive-restore-dropdown";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  urgency: string;
  dueDate: string | null;
  order: number;
  archivedAt?: string | null;
  assignee: { id: string; name: string | null; email?: string } | null;
};

export function KanbanCard({
  task,
  onEdit,
  onRefresh,
  isDrag,
}: {
  task: Task;
  onEdit: () => void;
  onRefresh?: () => void;
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
      className="group relative cursor-grab rounded-lg border border-white/10 bg-card p-3 active:cursor-grabbing hover:border-white/20"
    >
      {!isDrag && onRefresh && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <ArchiveRestoreDropdown
            entityType="task"
            entityId={task.id}
            isArchived={!!task.archivedAt}
            onSuccess={onRefresh}
          />
        </div>
      )}
      <p className="font-medium text-foreground pr-8">{task.title}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {task.dueDate && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(task.dueDate), "d MMM", { locale: tr })}
          </span>
        )}
        <span className={`rounded px-2 py-0.5 text-xs ${urgencyColor}`}>
          {task.urgency === "high" ? "Acil" : task.urgency === "medium" ? "Orta" : "Düşük"}
        </span>
        {task.assignee && (
          <span className="text-xs text-muted-foreground truncate max-w-[100px]" title={task.assignee.email ?? undefined}>
            {task.assignee.name || task.assignee.email || "—"}
          </span>
        )}
      </div>
    </div>
  );
}
