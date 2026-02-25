/**
 * CRM tipleri — Appwrite API yanıtlarına uyumlu (snake_case + camelCase).
 */

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  sector?: string | null;
  budget?: string | null;
  customQuestionAnswer?: string | null;
  custom_question_answer?: string | null;
  source: string;
  temperature: string;
  convertedAt?: string | null;
  converted_at?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: unknown | null;
}

export interface Customer {
  id: string;
  lead_id?: string | null;
  leadId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  deleted_at?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscription {
  id: string;
  customer_id?: string | null;
  customerId?: string | null;
  plan_name?: string | null;
  planName?: string | null;
  package_type?: string | null;
  packageType?: string | null;
  amount: number;
  status: string;
  start_date?: string | null;
  startDate?: string | null;
  next_payment_date?: string | null;
  nextPaymentDate?: string | null;
  remaining_amount?: string | null;
  remainingAmount?: string | null;
  remaining_due_date?: string | null;
  remainingDueDate?: string | null;
}

export type CustomerWithRelations = Customer & {
  lead: Lead | null;
  subscriptions: Subscription[];
  lastContactAt?: string | null;
  daysSinceContact?: number | null;
  contactPulse?: "green" | "yellow" | "red";
};
