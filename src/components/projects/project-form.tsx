"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideOver } from "@/components/ui/slide-over";
import { Customer } from "@/types";

const shootSchema = z
  .object({
    title: z.string().min(2, "Çekim adı en az 2 karakter olmalı"),
    shootType: z.enum(["video", "drone"]),
    startAt: z.string().min(1, "Başlangıç zorunludur"),
    endAt: z.string().min(1, "Bitiş zorunludur"),
    customerId: z.string().optional(),
    assigneeId: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["planlandi", "cekimde", "kurgu", "revize", "teslim"]).default("planlandi"),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: "Bitiş tarihi başlangıçtan sonra olmalı",
    path: ["endAt"],
  });

type ShootFormValues = z.infer<typeof shootSchema>;

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  projectId?: string | null;
  initialData?: {
    title: string;
    shootType: "video" | "drone";
    startAt: string;
    endAt: string;
    customerId?: string;
    assigneeId?: string;
    location?: string;
    notes?: string;
    status: string;
  } | null;
}

export function ProjectForm({ open, onOpenChange, onSuccess, projectId, initialData }: ProjectFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<ShootFormValues>({
    resolver: zodResolver(shootSchema),
    defaultValues: {
      title: "",
      shootType: "video",
      status: "planlandi",
      startAt: "",
      endAt: "",
    },
  });

  useEffect(() => {
    if (open && initialData) {
      form.reset({
        title: initialData.title,
        shootType: initialData.shootType,
        startAt: initialData.startAt,
        endAt: initialData.endAt,
        customerId: initialData.customerId ?? "",
        assigneeId: initialData.assigneeId ?? "",
        location: initialData.location ?? "",
        notes: initialData.notes ?? "",
        status: initialData.status as ShootFormValues["status"],
      });
    }
  }, [open, initialData, form]);

  useEffect(() => {
    if (open) {
      Promise.all([
        fetch("/api/customers").then((r) => r.json()),
        fetch("/api/users").then((r) => (r.ok ? r.json() : [])),
      ])
        .then(([custData, usersData]) => {
          if (Array.isArray(custData)) setCustomers(custData);
          else if (custData?.documents) setCustomers(custData.documents);
          else setCustomers([]);
          setUsers(Array.isArray(usersData) ? usersData : []);
        })
        .catch(() => toast.error("Veriler yüklenemedi"));
    }
  }, [open]);

  async function onSubmit(data: ShootFormValues) {
    setLoading(true);
    const isEdit = !!projectId;
    try {
      const url = isEdit ? `/api/projects/${projectId}` : "/api/projects";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          shootType: data.shootType,
          startAt: new Date(data.startAt).toISOString(),
          endAt: new Date(data.endAt).toISOString(),
          customerId: data.customerId || undefined,
          assigneeId: data.assigneeId || undefined,
          location: data.location || undefined,
          notes: data.notes || undefined,
          status: data.status,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, isEdit ? "Çekim güncellenemedi" : "Çekim oluşturulamadı"));
        return;
      }

      toast.success(isEdit ? "Çekim güncellendi" : "Çekim oluşturuldu");
      form.reset({ title: "", shootType: "video", status: "planlandi", startAt: "", endAt: "" });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlideOver title={projectId ? "Çekimi Düzenle" : "Yeni Çekim"} open={open} onOpenChange={onOpenChange}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Çekim Adı</FormLabel>
                <FormControl>
                  <Input placeholder="Örn: Reklam Film Çekimi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shootType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tür</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="drone">Drone</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Başlangıç</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bitiş</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Müşteri</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Atanan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Atanan seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="planlandi">Planlandı</SelectItem>
                    <SelectItem value="cekimde">Çekimde</SelectItem>
                    <SelectItem value="kurgu">Kurgu</SelectItem>
                    <SelectItem value="revize">Revize</SelectItem>
                    <SelectItem value="teslim">Teslim</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Konum</FormLabel>
                <FormControl>
                  <Input placeholder="Çekim yeri" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notlar</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Kaydediliyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </Form>
    </SlideOver>
  );
}
