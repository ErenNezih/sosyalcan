import { z } from "zod";

export const LEAD_SOURCES = [
  { value: "referans", label: "Referans / Tanıdık" },
  { value: "instagram", label: "Instagram" },
  { value: "google", label: "Google" },
  { value: "web_site", label: "Web Sitesi" },
  { value: "vitrin", label: "Vitrin" },
  { value: "manual", label: "Manuel" },
] as const;

export const LEAD_TEMPERATURES = [
  { value: "COLD", label: "Soğuk (Sadece sordu)" },
  { value: "WARM", label: "Ilık (İlgili)" },
  { value: "HOT", label: "Sıcak (Kredi kartı elinde)" },
] as const;

export const leadSchema = z.object({
  name: z.string().min(1, "Ad gerekli"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().optional(),
  sector: z.string().optional(),
  budget: z.string().optional(),
  customQuestionAnswer: z.string().optional(),
  source: z.enum(["vitrin", "manual", "referans", "instagram", "google", "web_site"]).default("manual"),
  temperature: z.enum(["COLD", "WARM", "HOT"]).default("WARM"),
});

export const directCustomerSchema = leadSchema.extend({
  company: z.string().optional(),
  notes: z.string().optional(),
});
export type DirectCustomerFormValues = z.infer<typeof directCustomerSchema>;

export type LeadFormValues = z.infer<typeof leadSchema>;
