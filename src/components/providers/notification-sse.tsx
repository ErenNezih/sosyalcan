"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function NotificationSSE() {
  const ref = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = new URL("/api/sse/notifications", window.location.origin);
    const es = new EventSource(url.toString());
    ref.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification" && data.title) {
          toast(data.title, {
            description: data.message,
            classNames: { toast: "glass border border-white/10" },
          });
        }
      } catch {
        // ignore
      }
    };

    es.onerror = () => {
      es.close();
      ref.current = null;
    };

    return () => {
      es.close();
      ref.current = null;
    };
  }, []);

  return null;
}
