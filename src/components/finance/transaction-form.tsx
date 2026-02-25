"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transactionSchema, type TransactionFormValues } from "@/lib/validations/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Customer = { id: string; name: string | null; email: string };
type Sub = { id: string; amount: unknown; planName: string | null; packageType: string; customerId: string };

export function TransactionForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Sub[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "income",
      date: new Date().toISOString().slice(0, 10),
      amount: undefined,
      customerId: "",
      isPartialPayment: false,
      expenseTag: "GENERAL",
    },
  });

  const type = watch("type");
  const customerId = watch("customerId");
  const isPartialPayment = watch("isPartialPayment");
  const expenseTag = watch("expenseTag");

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCustomers(Array.isArray(data) ? data : []));
    if (type === "income") {
      fetch("/api/subscriptions?finance=1")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setSubscriptions(Array.isArray(data) ? data : []));
    }
  }, [type]);

  const customerSubs = type === "income" && customerId
    ? subscriptions.filter((s) => s.customerId === customerId)
    : [];

  async function onSubmit(data: TransactionFormValues) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        amount: Number(data.amount),
        date: data.date instanceof Date ? data.date.toISOString() : data.date,
        customerId: data.customerId || undefined,
        isPartialPayment: type === "income" && data.isPartialPayment,
        subscriptionId: data.subscriptionId || undefined,
        remainingDueDate: data.remainingDueDate
          ? (data.remainingDueDate instanceof Date ? data.remainingDueDate.toISOString() : data.remainingDueDate)
          : undefined,
        expenseTag: type === "expense" ? data.expenseTag : undefined,
      }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "İşlem kaydedilemedi");
      return;
    }
    toast.success(data.isPartialPayment ? "Kısmi ödeme kaydedildi. Kalan vade takvime eklendi." : "İşlem kaydedildi. Dağılım uygulandı.");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Tür</Label>
        <div className="mt-2 flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" value="income" {...register("type")} className="text-primary" />
            <span>Gelir</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="expense" {...register("type")} className="text-primary" />
            <span>Gider</span>
          </label>
        </div>
      </div>
      {type === "income" && (
        <>
          <div className="sm:col-span-2">
            <Label htmlFor="customerId">Müşteri (gelir kaynağı)</Label>
            <select
              id="customerId"
              {...register("customerId")}
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
            >
              <option value="">— Seçin (opsiyonel)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isPartialPayment"
              {...register("isPartialPayment")}
              className="rounded border-input text-primary"
            />
            <Label htmlFor="isPartialPayment" className="font-normal">Kısmi ödeme (kapora / parçalı tahsilat)</Label>
          </div>
          {isPartialPayment && (
            <>
              <div className="sm:col-span-2">
                <Label htmlFor="subscriptionId">Abonelik (hangi tahsilat)</Label>
                <select
                  id="subscriptionId"
                  {...register("subscriptionId")}
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
                >
                  <option value="">— Abonelik seçin</option>
                  {customerSubs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.planName ?? s.packageType} – {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number(s.amount))}
                    </option>
                  ))}
                </select>
                {customerId && customerSubs.length === 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">Bu müşteriye ait aktif abonelik yok.</p>
                )}
                {errors.subscriptionId && <p className="mt-1 text-xs text-destructive">{errors.subscriptionId.message}</p>}
              </div>
              <div>
                <Label htmlFor="remainingDueDate">Kalan ödemenin vade tarihi</Label>
                <Input
                  id="remainingDueDate"
                  type="date"
                  {...register("remainingDueDate")}
                  className="mt-1 bg-white/5"
                />
                {errors.remainingDueDate && <p className="mt-1 text-xs text-destructive">{errors.remainingDueDate.message}</p>}
              </div>
            </>
          )}
        </>
      )}
      {type === "expense" && (
        <>
          <div className="sm:col-span-2">
            <Label>Gider etiketi</Label>
            <div className="mt-2 flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" value="GENERAL" {...register("expenseTag")} className="text-primary" />
                <span>Genel gider</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="PROJECT" {...register("expenseTag")} className="text-primary" />
                <span>Müşteri / Proje gideri</span>
              </label>
            </div>
          </div>
          {expenseTag === "PROJECT" && (
            <div className="sm:col-span-2">
              <Label htmlFor="expenseCustomerId">Hangi müşteri (proje)</Label>
              <select
                id="expenseCustomerId"
                {...register("customerId")}
                className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
              >
                <option value="">— Seçin</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
                ))}
              </select>
              {errors.customerId && <p className="mt-1 text-xs text-destructive">{errors.customerId.message}</p>}
            </div>
          )}
        </>
      )}
      <div>
        <Label htmlFor="date">Tarih</Label>
        <Input id="date" type="date" {...register("date")} className="mt-1 bg-white/5" required />
        {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
      </div>
      <div>
        <Label htmlFor="amount">Tutar (TL)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          className="mt-1 bg-white/5"
          required
        />
        {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div>
        <Label htmlFor="category">Kategori</Label>
        <Input id="category" {...register("category")} className="mt-1 bg-white/5" />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">Açıklama</Label>
        <Input id="description" {...register("description")} className="mt-1 bg-white/5" />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
