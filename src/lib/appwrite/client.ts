/**
 * Appwrite Web SDK — yalnızca tarayıcı (client component / client-side) kullanımı.
 * Login, logout, session ve kullanıcıya özel veri erişimi için.
 */

import { Account, Client, Databases, Storage } from "appwrite";
import { APPWRITE } from "./constants";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

/** Debug: Tarayıcıda env değerlerinin gelip gelmediğini kontrol eder (F12 Console). */
export function getAppwriteConfigStatus(): {
  endpointOk: boolean;
  projectIdOk: boolean;
  message: string;
} {
  const endpointOk = Boolean(endpoint?.trim());
  const projectIdOk = Boolean(projectId?.trim());
  let message = "Appwrite config: ";
  if (endpointOk && projectIdOk) message += "OK (endpoint + projectId set)";
  else {
    const missing: string[] = [];
    if (!endpointOk) missing.push("NEXT_PUBLIC_APPWRITE_ENDPOINT");
    if (!projectIdOk) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
    message += `Eksik: ${missing.join(", ")}. Vercel'de Build env'de tanımlı olmalı.`;
  }
  return { endpointOk, projectIdOk, message };
}

function getClient(): Client {
  const client = new Client();
  if (endpoint) client.setEndpoint(endpoint);
  if (projectId) client.setProject(projectId);
  return client;
}

const client = getClient();

export const appwriteClient = client;
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { APPWRITE };
