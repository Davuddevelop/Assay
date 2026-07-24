"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastTone = "info" | "warn" | "success";

export interface Toast {
  id: number;
  title: string;
  message?: string;
  tone: ToastTone;
  action?: { label: string; href: string };
  /** ms before auto-dismiss; 0 keeps it until dismissed. */
  duration: number;
}

type ToastInput = Omit<Toast, "id" | "tone" | "duration"> & {
  tone?: ToastTone;
  duration?: number;
};

const ToastContext = createContext<{ notify: (t: ToastInput) => void } | null>(null);

/** Fire a prominent on-screen notification. Throws if used outside the provider. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const TONE: Record<ToastTone, { ring: string; dot: string; label: string }> = {
  info: { ring: "border-iris/50", dot: "bg-iris", label: "text-iris-soft" },
  warn: { ring: "border-oxblood/60", dot: "bg-oxblood", label: "text-oxblood-soft" },
  success: { ring: "border-iris/50", dot: "bg-iris", label: "text-iris-soft" },
};

/**
 * A top-center notification stack — deliberately large and unmissable (not an
 * easy-to-skip inline note). Slides down, auto-dismisses on a timer, and can
 * carry a single action (e.g. "Upgrade to Pro"). Mounted once per app shell.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((input: ToastInput) => {
    const id = ++idRef.current;
    const toast: Toast = {
      id,
      title: input.title,
      message: input.message,
      tone: input.tone ?? "info",
      action: input.action,
      duration: input.duration ?? 6000,
    };
    setToasts((prev) => [...prev, toast]);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-3 px-4 sm:top-6"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!toast.duration) return;
    const timer = window.setTimeout(onDismiss, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  const tone = TONE[toast.tone];

  return (
    <div
      role="alert"
      className={cn(
        "glass pointer-events-auto w-full max-w-md rounded-[var(--radius-card)] border p-4 shadow-2xl transition-all duration-300 sm:p-5",
        tone.ring,
        shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0",
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", tone.dot)} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-mono text-[11px] uppercase tracking-[0.16em]",
              tone.label,
            )}
          >
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-1.5 text-sm leading-relaxed text-ivory-dim">
              {toast.message}
            </p>
          )}
          {toast.action && (
            <Button
              href={toast.action.href}
              variant="primary"
              size="sm"
              className="mt-3"
            >
              {toast.action.label}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-pill px-2 py-1 font-mono text-xs text-ash transition-colors hover:text-ivory"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
