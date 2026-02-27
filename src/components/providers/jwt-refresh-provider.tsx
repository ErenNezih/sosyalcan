"use client";

import { useEffect } from "react";
import { account } from "@/lib/appwrite/client";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes (JWT expires in 15)

export function JwtRefreshProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function refreshJwt() {
      try {
        const res = await account.createJWT();
        const jwt = typeof res === "object" && res?.jwt ? res.jwt : String(res ?? "");
        if (!jwt) return;
        await fetch("/api/auth/jwt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jwt }),
          credentials: "include",
        });
      } catch {
        // Session may not exist; silently skip
      }
    }

    refreshJwt();
    const id = setInterval(refreshJwt, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return <>{children}</>;
}
