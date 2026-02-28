"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

type User = { id: string; name: string; email: string };

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error("Oturum alınamadı");
        return r.json();
      })
      .then((data) => {
        if (data?.ok && data?.data) setUser(data.data);
        else setError("Kullanıcı bilgisi yüklenemedi");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Hata oluştu");
      });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p className="text-muted-foreground">Hesap bilgileri</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hesap</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!user && !error && (
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          )}
          {user && (
            <div className="space-y-1">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-4">
                <SignOutButton />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
