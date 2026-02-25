import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "Ad gerekli"),
  email: z.string().email("Geçerli e-posta girin"),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export const assignPackageSchema = z.object({
  customerId: z.string().cuid(),
  packageType: z.enum(["STARTER", "PRO", "PREMIUM"]),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
export type AssignPackageValues = z.infer<typeof assignPackageSchema>;
