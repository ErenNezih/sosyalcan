"use client";

/**
 * Oturum bilgisi iron-session ile yönetiliyor.
 * Oturum bilgisi dashboard layout'ta server-side (getSessionFromCookieStore) ile alınıyor.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
