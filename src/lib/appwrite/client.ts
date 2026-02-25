/**
 * Appwrite Web SDK — yalnızca tarayıcı (client component / client-side) kullanımı.
 * Login, logout, session ve kullanıcıya özel veri erişimi için.
 */

import { Account, Client, Databases, Storage } from "appwrite";
import { APPWRITE } from "./constants";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

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
