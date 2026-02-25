"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigneeId: string | null;
  urgency: string;
  dueDate: string | null;
  assignee: { id: string; name: string | null } | null;
};

export function TaskForm({
  taskId,
  task,
  onSuccess,
  onCancel,
}: {
  taskId: string | null;
  task: Task | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("BEKLEYEN");
  const [urgency, setUrgency] = useState("medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string | null }[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setStatus(task.status);
      setUrgency(task.urgency);
      setAssigneeId(task.assigneeId ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "");
    }
  }, [task]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (taskId) {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || null,
            status,
            urgency,
            assigneeId: assigneeId || null,
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
        });
        if (res.ok) onSuccess();
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: description || null,
            status,
            urgency,
            assigneeId: assigneeId || null,
            dueDate: dueDate ? new Date(dueDate) : null,
          }),
        });
        if (res.ok) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div>
        <Label htmlFor="status">Durum</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
        >
          <option value="BEKLEYEN">Bekleyen</option>
          <option value="KURGUDA">Kurguda</option>
          <option value="REVIZEDE">Revizede</option>
          <option value="TAMAMLANDI">Tamamlandı</option>
        </select>
      </div>
      <div>
        <Label htmlFor="urgency">Aciliyet</Label>
        <select
          id="urgency"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
        >
          <option value="low">Düşük</option>
          <option value="medium">Orta (Sarı)</option>
          <option value="high">Yüksek (Kırmızı)</option>
        </select>
      </div>
      <div>
        <Label htmlFor="assignee">Atanan</Label>
        <select
          id="assignee"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name ?? u.id}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="dueDate">Teslim Tarihi</Label>
        <Input id="dueDate" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 bg-white/5" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="desc">Açıklama</Label>
        <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 bg-white/5" />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
      </div>
    </form>
  );
}
