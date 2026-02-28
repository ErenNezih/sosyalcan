/**
 * CRM tipleri — API yanıtlarına uyumlu (snake_case + camelCase).
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
  convertedCustomerId?: string | null;
  converted_customer_id?: string | null;
  converting?: boolean | null;
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

export interface Project {
  id: string;
  customer_id?: string | null;
  customerId?: string | null;
  customer?: { id: string; name: string } | null;
  name: string;
  status: "active" | "on_hold" | "done" | "archived" | "planlandi" | "cekimde" | "kurgu" | "revize" | "teslim";
  start_date?: string | null;
  startDate?: string | null;
  due_date?: string | null;
  dueDate?: string | null;
  end_at?: string | null;
  endAt?: string | null;
  shootType?: "video" | "drone";
  location?: string | null;
  assigneeId?: string | null;
  assignee?: { id: string; name: string; email?: string } | null;
  budget?: number | null;
  priority?: "high" | "medium" | "low" | null;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  created_by?: string | null;
  createdBy?: string | null;
  archived_at?: string | null;
  archivedAt?: string | null;
}

export interface Deliverable {
  id: string;
  project_id: string;
  projectId: string;
  type: "logo" | "web" | "reels" | "seo" | "ads" | "branding" | "other";
  title: string;
  status: "todo" | "in_progress" | "client_review" | "revision" | "approved" | "delivered" | "archived";
  revision_count?: number | null;
  revisionCount?: number | null;
  approval_required?: boolean | null;
  approvalRequired?: boolean | null;
  approved_at?: string | null;
  approvedAt?: string | null;
  due_date?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ContactLog {
  id: string;
  customer_id: string;
  customerId: string;
  channel: "phone" | "whatsapp" | "email" | "meeting" | "instagram" | "other";
  summary: string;
  next_follow_up_at?: string | null;
  nextFollowUpAt?: string | null;
  created_at?: string;
  createdAt?: string;
  created_by?: string | null;
  createdBy?: string | null;
}

export interface FinanceSettings {
  id: string;
  bucket_owner_user_id_1?: string | null;
  bucketOwnerUserId1?: string | null;
  bucket_owner_user_id_2?: string | null;
  bucketOwnerUserId2?: string | null;
  bucket_labels?: string | null; // JSON string
  bucketLabels?: string | null;
  default_bucket_ratios?: string | null; // JSON string
  defaultBucketRatios?: string | null;
}

export type CustomerWithRelations = Customer & {
  lead: Lead | null;
  subscriptions: Subscription[];
  projects?: Project[];
  contactLogs?: ContactLog[];
  lastContactAt?: string | null;
  daysSinceContact?: number | null;
  contactPulse?: "green" | "yellow" | "red";
};
