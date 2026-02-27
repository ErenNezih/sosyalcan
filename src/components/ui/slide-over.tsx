"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface SlideOverProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
}

export function SlideOver({
  open,
  onClose,
  onOpenChange,
  title,
  children,
  className,
  showClose = true,
}: SlideOverProps) {
  const handleClose = React.useCallback(() => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  }, [onClose, onOpenChange]);

  React.useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) {
      document.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={cn(
              "fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-background/95 backdrop-blur-md border-l border-white/10 shadow-2xl",
              "sm:max-w-2xl",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "slide-over-title" : undefined}
          >
            {(title || showClose) && (
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-background/80 backdrop-blur-md px-6 py-4">
                {title && (
                  <h2 id="slide-over-title" className="text-lg font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {showClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="ml-auto"
                    aria-label="Kapat"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
