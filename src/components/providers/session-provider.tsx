"use client";

/**
 * Appwrite kullanıldığı için NextAuth SessionProvider kaldırıldı.
 * Oturum bilgisi dashboard layout'ta server-side (getSessionFromCookieStore) ile alınıyor.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
