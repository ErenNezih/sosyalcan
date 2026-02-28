"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";

const TYPES = ["crm", "todo", "finance"] as const;

function generateMeetLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

type Customer = { id: string; name: string; email: string };

export function AppointmentForm({
  appointmentId,
  defaultDate,
  onSuccess,
  onCancel,
}: {
  appointmentId: string | null;
  defaultDate: Date;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [type, setType] = useState<"crm" | "todo" | "finance">("crm");
  const [relatedId, setRelatedId] = useState("");
  const [relatedType, setRelatedType] = useState<"Customer" | "Lead" | "">("");
  const [meetToggle, setMeetToggle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const d = defaultDate;
    const startStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T09:00`;
    const endStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T10:00`;
    setStart(startStr);
    setEnd(endStr);
  }, [defaultDate]);

  useEffect(() => {
    if (!appointmentId) return;
    fetch(`/api/appointments/${appointmentId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((a: { title?: string; description?: string | null; start?: string; end?: string; relatedId?: string | null; relatedType?: string | null } | null) => {
        if (!a) return;
        setTitle(a.title ?? "");
        setDescription(a.description ?? "");
        if (a.start) setStart(new Date(a.start).toISOString().slice(0, 16));
        if (a.end) setEnd(new Date(a.end).toISOString().slice(0, 16));
        if (a.relatedType && a.relatedId) {
          setRelatedType(a.relatedType as "Customer" | "Lead");
          setRelatedId(a.relatedId);
        }
      });
  }, [appointmentId]);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  useEffect(() => {
    if (meetToggle && !description?.includes("meet.google.com")) {
      setDescription((prev) => (prev ? `${prev}\n\n${generateMeetLink()}` : generateMeetLink()));
    }
  }, [meetToggle]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let desc = description;
      if (meetToggle && !desc?.includes("meet.google.com")) {
        desc = (desc ? `${desc}\n\n` : "") + generateMeetLink();
      }
      if (appointmentId) {
        const res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: desc,
            start: new Date(start),
            end: new Date(end),
            relatedId: relatedId || null,
            relatedType: relatedType || null,
          }),
        });
        if (res.ok) {
          onSuccess();
        } else {
          const body = await res.json().catch(() => ({}));
          toast.error(getApiErrorMessage(res, body, "Randevu güncellenemedi"));
        }
      } else {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: desc,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
            type,
            relatedId: relatedId || null,
            relatedType: relatedType || null,
          }),
        });
        if (res.ok) {
          onSuccess();
        } else {
          const body = await res.json().catch(() => ({}));
          toast.error(getApiErrorMessage(res, body, "Randevu eklenemedi"));
        }
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
      <div className="sm:col-span-2">
        <Label htmlFor="related">Müşteri (opsiyonel)</Label>
        <select
          id="related"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
          value={relatedType === "Customer" && relatedId ? relatedId : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              setRelatedId("");
              setRelatedType("");
              return;
            }
            setRelatedType("Customer");
            setRelatedId(v);
          }}
        >
          <option value="">— Seçin (opsiyonel)</option>
          {customers.map((x) => (
            <option key={x.id} value={x.id}>{x.name} ({x.email})</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="start">Başlangıç</Label>
        <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div>
        <Label htmlFor="end">Bitiş</Label>
        <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      {!appointmentId && (
        <div className="sm:col-span-2">
          <Label>Tür</Label>
          <div className="mt-2 flex gap-4">
            {TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="type" checked={type === t} onChange={() => setType(t)} className="text-primary" />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div className="sm:col-span-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMeetToggle(!meetToggle)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
            meetToggle ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
        >
          <Video className="h-4 w-4" />
          Google Meet linki oluştur
        </button>
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
