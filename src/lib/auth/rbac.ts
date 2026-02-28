import { getAppwriteAdmin, getSessionFromRequest } from "@/lib/appwrite/server";
import { APPWRITE } from "@/lib/appwrite/constants";
import { Query } from "node-appwrite";

export type Role = "admin" | "staff" | "readonly";

export async function getUserRole(userId: string): Promise<Role> {
  const { databases } = getAppwriteAdmin();
  try {
    const response = await databases.listDocuments(
      APPWRITE.databaseId,
      APPWRITE.collections.userProfiles,
      [Query.equal("user_id", userId), Query.limit(1)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0] as any;
      return (doc.role as Role) || "readonly";
    }
    
    // Default role if no profile found (e.g. first user or not set)
    // Default to staff so new users can create projects/leads/customers
    return "staff";
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "staff";
  }
}

export async function requireRole(request: Request, allowedRoles: Role[]) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return { authorized: false, error: "Unauthorized", status: 401 };
  }

  const role = await getUserRole(session.$id);
  
  // Super Admin override? 
  // If role is 'admin', allow everything?
  // Or strict check.
  
  if (role === "admin") {
    return { authorized: true, user: session, role };
  }

  if (!allowedRoles.includes(role)) {
    return { authorized: false, error: "Forbidden", status: 403 };
  }

  return { authorized: true, user: session, role };
}
