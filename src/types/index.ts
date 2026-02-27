import { Models } from "node-appwrite";

/**
 * Merkezi tip tanımları — Appwrite API yanıtları ve UI propları.
 */
export type {
  Lead,
  Customer,
  Subscription,
  Project,
  Deliverable,
  ContactLog,
  FinanceSettings,
  CustomerWithRelations,
} from "./crm";

export type AppwriteDocument = Models.Document & {
  [key: string]: any;
};
