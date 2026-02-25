"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  directCustomerSchema,
  LEAD_SOURCES,
  LEAD_TEMPERATURES,
  type DirectCustomerFormValues,
} from "@/lib/validations/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AddDirectCustomerForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<DirectCustomerFormValues>({
    resolver: zodResolver(directCustomerSchema),
    defaultValues: { source: "manual", temperature: "WARM" },
  });

  const temperature = watch("temperature");

  async function onSubmit(data: DirectCustomerFormValues) {
    const res = await fetch("/api/customers/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e?.error?.message ?? "Müşteri eklenemedi");
      return;
    }
    toast.success("Aktif müşteri eklendi.");
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <p className="text-sm text-muted-foreground">
          Potansiyel sürecini atlayıp doğrudan aktif müşteri ekleyin. İsterseniz sonra paket atayabilirsiniz.
        </p>
      </div>
      <div>
        <Label htmlFor="name">Ad Soyad *</Label>
        <Input id="name" className="mt-1 bg-white/5" {...register("name")} />
        {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">E-posta *</Label>
        <Input id="email" type="email" className="mt-1 bg-white/5" {...register("email")} />
        {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" className="mt-1 bg-white/5" {...register("phone")} />
      </div>
      <div>
        <Label htmlFor="company">Şirket / Firma</Label>
        <Input id="company" className="mt-1 bg-white/5" {...register("company")} />
      </div>
      <div>
        <Label htmlFor="sector">Sektör</Label>
        <Input id="sector" className="mt-1 bg-white/5" {...register("sector")} />
      </div>
      <div>
        <Label htmlFor="budget">Bütçe</Label>
        <Input id="budget" className="mt-1 bg-white/5" {...register("budget")} />
      </div>
      <div className="sm:col-span-2">
        <Label>Kaynak</Label>
        <select
          className="mt-1 flex h-10 w-full rounded-md border border-input bg-white/5 px-3 py-2 text-sm"
          {...register("source")}
        >
          {LEAD_SOURCES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label>Sıcaklık</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEAD_TEMPERATURES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setValue("temperature", t.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                temperature === t.value ? "border-primary bg-primary/20 text-primary" : "border-white/10 bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="notes">Notlar</Label>
        <Input id="notes" className="mt-1 bg-white/5" {...register("notes")} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="customQuestionAnswer">Özel soru / not</Label>
        <Input id="customQuestionAnswer" className="mt-1 bg-white/5" {...register("customQuestionAnswer")} />
      </div>
      <div className="sm:col-span-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>İptal</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Aktif Müşteri Ekle"}
        </Button>
      </div>
    </form>
  );
}
