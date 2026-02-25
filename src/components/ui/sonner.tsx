"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "glass border border-white/10",
        },
      }}
    />
  );
}
