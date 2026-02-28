"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function TransactionFormSimple({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState("");

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data : []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount.replace(",", "."));
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Geçerli bir tutar girin");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: amt,
          date: date ? `${date}T12:00:00.000Z` : new Date().toISOString(),
          customerId: customerId || null,
          notes: notes || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json?.message ?? "İşlem kaydedilemedi");
        return;
      }
      toast.success("İşlem kaydedildi");
      onSuccess();
    } catch (err) {
      toast.error("Hata: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <Label>Tür</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="income" checked={type === "income"} onChange={() => setType("income")} className="text-primary" />
            <span>Gelir</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="expense" checked={type === "expense"} onChange={() => setType("expense")} className="text-primary" />
            <span>Gider</span>
          </label>
        </div>
      </div>
      <div>
        <Label htmlFor="amount">Tutar (TL)</Label>
        <Input id="amount" type="text" inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div>
        <Label htmlFor="date">Tarih</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 bg-white/5" required />
      </div>
      <div>
        <Label htmlFor="customer">Müşteri (opsiyonel)</Label>
        <select id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm">
          <option value="">—</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="notes">Not</Label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 bg-white/5" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={loading}>{loading ? "Kaydediliyor..." : "Kaydet"}</Button>
      </div>
    </form>
  );
}
