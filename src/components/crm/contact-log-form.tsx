"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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

const contactLogSchema = z.object({
  customerId: z.string().min(1),
  channel: z.enum(["phone", "whatsapp", "email", "meeting", "instagram", "other"]).default("phone"),
  summary: z.string().min(1, "Özet zorunludur"),
  nextFollowUpAt: z.string().optional(),
});

type ContactLogFormValues = z.infer<typeof contactLogSchema>;

interface ContactLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess?: () => void;
}

export function ContactLogForm({ open, onOpenChange, customerId, onSuccess }: ContactLogFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ContactLogFormValues>({
    resolver: zodResolver(contactLogSchema),
    defaultValues: {
      customerId,
      channel: "phone",
      summary: "",
    },
  });

  async function onSubmit(data: ContactLogFormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "İletişim kaydı oluşturulamadı");
      }

      toast.success("İletişim kaydı eklendi");
      form.reset({ customerId, channel: "phone", summary: "" });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SlideOver title="Yeni İletişim Kaydı" open={open} onOpenChange={onOpenChange}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kanal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="phone">Telefon</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">E-posta</SelectItem>
                    <SelectItem value="meeting">Toplantı</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="other">Diğer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Özet</FormLabel>
                <FormControl>
                  <Textarea placeholder="Görüşme notları..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nextFollowUpAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sonraki Takip (Opsiyonel)</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
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
              {loading ? "Kaydediliyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </Form>
    </SlideOver>
  );
}
