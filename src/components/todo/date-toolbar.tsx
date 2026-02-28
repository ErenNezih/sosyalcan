"use client";

import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { todayString, relativeDay } from "@/lib/date-utils";

interface DateToolbarProps {
  day: string;
  onDayChange: (day: string) => void;
  showArchived?: boolean;
  onShowArchivedChange?: (v: boolean) => void;
}

export function DateToolbar({
  day,
  onDayChange,
  showArchived = false,
  onShowArchivedChange,
}: DateToolbarProps) {
  const isToday = day === todayString();
  const yesterday = relativeDay(-1);
  const tomorrow = relativeDay(1);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDayChange(yesterday)}
          className="h-8 px-2"
        >
          Dün
        </Button>
        <Button
          variant={isToday ? "secondary" : "ghost"}
          size="sm"
          onClick={() => onDayChange(todayString())}
          className="h-8 px-2"
        >
          Bugün
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDayChange(tomorrow)}
          className="h-8 px-2"
        >
          Yarın
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={day}
          onChange={(e) => onDayChange(e.target.value)}
          className="h-9 rounded-md border border-input bg-white/5 px-3 py-1 text-sm"
        />
        <span className="text-sm font-medium text-muted-foreground">
          {format(new Date(day + "T12:00:00"), "d MMMM yyyy", { locale: tr })}
        </span>
      </div>
      {onShowArchivedChange && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => onShowArchivedChange(e.target.checked)}
            className="rounded text-primary"
          />
          Arşivdekileri göster
        </label>
      )}
    </div>
  );
}
