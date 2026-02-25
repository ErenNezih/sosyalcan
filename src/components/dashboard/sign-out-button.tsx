"use client";

import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await account.deleteSession("current");
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="mt-2 w-full justify-start gap-2 text-muted-foreground"
      onClick={handleSignOut}
    >
      <LogOut className="h-4 w-4" />
      Çıkış
    </Button>
  );
}
