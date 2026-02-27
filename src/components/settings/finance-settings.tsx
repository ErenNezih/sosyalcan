"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { DEFAULT_SPLIT_PERCENTAGES } from "@/lib/finance";

const financeSettingsSchema = z.object({
  bucketOwnerUserId1: z.string().optional(),
  bucketOwnerUserId2: z.string().optional(),
  // Ratios are read-only for now, but we can display them
});

type FinanceSettingsFormValues = z.infer<typeof financeSettingsSchema>;

interface User {
  id: string;
  name: string | null;
  email: string;
}

export function FinanceSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<FinanceSettingsFormValues>({
    resolver: zodResolver(financeSettingsSchema),
    defaultValues: {
      bucketOwnerUserId1: "",
      bucketOwnerUserId2: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/settings/finance"),
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          form.reset({
            bucketOwnerUserId1: settingsData.bucketOwnerUserId1 || "",
            bucketOwnerUserId2: settingsData.bucketOwnerUserId2 || "",
          });
        }
      } catch (error) {
        toast.error("Ayarlar yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [form]);

  async function onSubmit(data: FinanceSettingsFormValues) {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(getApiErrorMessage(res, body, "Kaydedilemedi"));
        return;
      }

      toast.success("Finans ayarları güncellendi.");
    } catch (error) {
      toast.error("Hata: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Yükleniyor...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Finans Ayarları
        </CardTitle>
        <CardDescription>
          Gelir dağılımı için bucket sahiplerini ve oranları yönetin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="bucketOwnerUserId1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı 1 (EREN Bucket)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kullanıcı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
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
                name="bucketOwnerUserId2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı 2 (KERIM Bucket)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kullanıcı seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Varsayılan Dağılım Oranları (Read-only)</h3>
              <div className="grid gap-2 text-sm text-muted-foreground">
                {DEFAULT_SPLIT_PERCENTAGES.map((ratio) => (
                  <div key={ratio.bucket} className="flex justify-between border-b border-white/5 py-1">
                    <span>{ratio.bucket}</span>
                    <span>%{ratio.percentage}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
