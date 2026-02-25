"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { account, getAppwriteConfigStatus } from "@/lib/appwrite/client";
import { setSessionSyncCookie } from "@/lib/session-sync-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Appwrite hatasında code/message/type/response çıkarır (debug için). */
function getAppwriteErrorDetail(err: unknown): { message: string; code?: number; type?: string; response?: string } {
  if (!err || typeof err !== "object") return { message: String(err) };
  const o = err as Record<string, unknown>;
  return {
    message: typeof o.message === "string" ? o.message : "",
    code: typeof o.code === "number" ? o.code : undefined,
    type: typeof o.type === "string" ? o.type : undefined,
    response: typeof o.response === "string" ? o.response : undefined,
  };
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  // Debug: Sayfa yüklendiğinde Appwrite env durumunu konsola yaz (F12 → Console)
  useEffect(() => {
    const status = getAppwriteConfigStatus();
    console.log("[Login] Appwrite config:", status.message);
    if (!status.endpointOk || !status.projectIdOk) {
      console.warn("[Login] Eksik env — giriş isteği başarısız olabilir.", status);
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorDetail(null);
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      setSessionSyncCookie();
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      const detail = getAppwriteErrorDetail(err);
      const msg = detail.message;
      const isSessionExists = detail.type === "user_session_already_exists";

      // Zaten aktif oturum (localStorage'da): hayalet oturumu silip tekrar dene
      if (isSessionExists) {
        try {
          await account.deleteSession("current");
        } catch {
          await account.deleteSessions();
        }
        try {
          await account.createEmailPasswordSession(email, password);
          setSessionSyncCookie();
          router.push(callbackUrl);
          router.refresh();
          return;
        } catch (retryErr) {
          console.error("[Login] deleteSession + retry failed:", retryErr);
          setError("Mevcut oturum kapatılamadı. Lütfen çıkış yapıp tekrar deneyin veya tarayıcı çerezlerini temizleyin.");
          setErrorDetail(null);
          setLoading(false);
          return;
        }
      }

      // Tarayıcı konsoluna tam hata (F12 → Console)
      console.error("[Login] createEmailPasswordSession failed:", {
        message: detail.message,
        code: detail.code,
        type: detail.type,
        response: detail.response,
        raw: err,
      });

      setErrorDetail(
        [detail.code != null && `Code: ${detail.code}`, detail.type && `Type: ${detail.type}`, detail.response && `Response: ${detail.response}`]
          .filter(Boolean)
          .join(" · ") || null
      );

      if (/network request failed|failed to fetch|load failed|net::/i.test(msg)) {
        setError("Appwrite sunucusuna bağlanılamadı. Appwrite Console'da projeye bir Web platformu ekleyin: Overview veya Auth → Settings'te «Add platform» → Web, Hostname olarak bu sitenin adresi (örn. localhost veya sosyalcan.vercel.app — https olmadan).");
      } else if (/verif|doğrulan|unverified|confirm/i.test(msg)) {
        setError("E-posta adresiniz henüz doğrulanmamış. Appwrite Console → Auth → kullanıcıya tıklayıp «Verify account» ile doğrulayın.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Geçersiz e-posta veya şifre.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="glass-card w-full max-w-sm p-8">
        <h1 className="text-center text-2xl font-semibold text-primary">
          Sosyalcan Komuta Merkezi
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sadece yetkili kullanıcılar giriş yapabilir.
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-white/5 border-white/10"
              placeholder="e-posta@ornek.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-white/5 border-white/10"
              required
            />
          </div>
          {error && (
            <div className="space-y-1">
              <p className="text-sm text-destructive">{error}</p>
              {errorDetail && (
                <p className="text-xs text-muted-foreground font-mono break-all" title="F12 Console'da daha fazla detay">
                  Hata detayı: {errorDetail}
                </p>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><div className="text-muted-foreground">Yükleniyor...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
