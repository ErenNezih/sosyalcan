import { z } from "zod";

const amountSchema = z
  .number({
    required_error: "Tutar girin",
    invalid_type_error: "Geçerli bir sayı girin",
  })
  .refine((n) => Number.isFinite(n) && !Number.isNaN(n), "Geçerli bir tutar girin")
  .refine((n) => n >= 0.01, "Tutar 0,01 TL veya daha fazla olmalı")
  .refine((n) => n <= 99_999_999.99, "Tutar çok büyük");

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: amountSchema,
  description: z.string().optional(),
  date: z.union([z.coerce.date(), z.string()]),
  category: z.string().optional(),
  customerId: z.string().optional(),
  isPartialPayment: z.boolean().optional(),
  subscriptionId: z.string().optional(),
  remainingDueDate: z.union([z.coerce.date(), z.string()]).optional(),
  expenseTag: z.enum(["GENERAL", "PROJECT"]).optional(),
}).refine(
  (d) => {
    if (d.type !== "expense") return true;
    if (d.expenseTag === "PROJECT") return !!d.customerId;
    return true;
  },
  { message: "Proje gideri için müşteri seçin", path: ["customerId"] }
).refine(
  (d) => {
    if (!d.isPartialPayment || d.type !== "income") return true;
    return !!(d.subscriptionId && d.remainingDueDate);
  },
  { message: "Kısmi ödeme için abonelik ve kalan vade tarihi gerekli", path: ["subscriptionId"] }
);

export type TransactionFormValues = z.infer<typeof transactionSchema>;
