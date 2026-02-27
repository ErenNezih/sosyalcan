"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { appwriteClient, APPWRITE } from "@/lib/appwrite/client";

export function NotificationRealtime() {
  useEffect(() => {
    // Subscribe to notifications collection
    // Channel: databases.[ID].collections.[ID].documents
    const channel = `databases.${APPWRITE.databaseId}.collections.${APPWRITE.collections.notifications}.documents`;
    
    const unsubscribe = appwriteClient.subscribe(channel, (response) => {
      if (response.events.includes("databases.*.collections.*.documents.*.create")) {
        const payload = response.payload as any;
        if (payload.title) {
          toast(payload.title, {
            description: payload.message,
            classNames: { toast: "glass border border-white/10" },
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
