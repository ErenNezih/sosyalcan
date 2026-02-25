import { Query } from "node-appwrite";
import type { Models } from "node-appwrite";

/** Appwrite document'ı API yanıtına uygun objeye çevirir (id, createdAt, updatedAt + diğer attribute'lar). */
export function mapDocument<T extends Record<string, unknown>>(doc: Models.Document): T & { id: string; createdAt: string; updatedAt: string } {
  const { $id, $createdAt, $updatedAt, ...rest } = doc as Models.Document & Record<string, unknown>;
  return {
    id: $id,
    createdAt: $createdAt,
    updatedAt: $updatedAt,
    ...rest,
  } as unknown as T & { id: string; createdAt: string; updatedAt: string };
}

export function mapDocumentList<T>(list: Models.DocumentList<Models.Document>): (T & { id: string; createdAt: string; updatedAt: string })[] {
  return list.documents.map((d) => mapDocument(d) as T & { id: string; createdAt: string; updatedAt: string });
}

export { Query };
