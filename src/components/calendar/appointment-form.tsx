"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

const TYPES = ["crm", "todo", "finance"] as const;

function generateMeetLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const part = (len: number) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${part(3)}-${part(4)}-${part(3)}`;
}

type Customer = { id: string; name: string; email: string };
type Lead = { id: string; name: string; email: string };

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
  const [leads, setLeads] = useState<Lead[]>([]);

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
    fetch("/api/leads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setLeads(list.filter((l: { customer?: unknown }) => !l.customer));
      });
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
        if (res.ok) onSuccess();
      } else {
        const res = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description: desc,
            start: new Date(start),
            end: new Date(end),
            type,
            relatedId: relatedId || null,
            relatedType: relatedType || null,
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
      <div className="sm:col-span-2">
        <Label htmlFor="related">Kiminle / İlgili (Müşteri veya Potansiyel)</Label>
        <select
          id="related"
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
          value={relatedType && relatedId ? `${relatedType}:${relatedId}` : ""}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) {
              setRelatedId("");
              setRelatedType("");
              return;
            }
            const [t, id] = v.split(":");
            setRelatedType(t as "Customer" | "Lead");
            setRelatedId(id);
          }}
        >
          <option value="">— Seçin (opsiyonel)</option>
          <optgroup label="Müşteriler">
            {customers.map((x) => (
              <option key={`C:${x.id}`} value={`Customer:${x.id}`}>{x.name} ({x.email})</option>
            ))}
          </optgroup>
          <optgroup label="Potansiyeller">
            {leads.map((x) => (
              <option key={`L:${x.id}`} value={`Lead:${x.id}`}>{x.name} ({x.email})</option>
            ))}
          </optgroup>
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
