"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastInput {
  variant?: ToastVariant;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastItem extends ToastInput {
  id: number;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantMap = {
  success: {
    className: "border-green-500 bg-green-50 text-green-900",
    icon: CheckCircle,
    iconClass: "text-green-600",
  },
  error: {
    className: "border-red-500 bg-red-50 text-red-900",
    icon: XCircle,
    iconClass: "text-red-600",
  },
  info: {
    className: "border-blue-500 bg-blue-50 text-blue-900",
    icon: Info,
    iconClass: "text-blue-600",
  },
  warning: {
    className: "border-amber-500 bg-amber-50 text-amber-900",
    icon: AlertTriangle,
    iconClass: "text-amber-600",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());

  const dismiss = useCallback((id: number) => {
    setExiting((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = Date.now() + Math.random();
      const item: ToastItem = {
        id,
        variant: input.variant ?? "info",
        message: input.message,
        duration: input.duration ?? 4000,
        action: input.action,
      };

      setToasts((current) => [...current, item]);
      window.setTimeout(() => dismiss(id), item.duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} exiting={exiting} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function Toaster({
  toasts,
  exiting,
  onDismiss,
}: {
  toasts: ToastItem[];
  exiting: Set<number>;
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-[9999] flex w-[calc(100vw-32px)] max-w-sm flex-col gap-2 sm:right-5">
      {toasts.map((toast) => {
        const variant = variantMap[toast.variant];
        const Icon = variant.icon;
        const isExiting = exiting.has(toast.id);

        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-md border-l-4 p-4 shadow-hover transition-all duration-300",
              isExiting
                ? "translate-x-full opacity-0"
                : "translate-x-0 opacity-100",
              !isExiting && "animate-toast-in",
              variant.className,
            )}
          >
            <Icon
              className={cn("mt-0.5 h-5 w-5 shrink-0", variant.iconClass)}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className="mt-2 text-sm font-semibold underline"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded text-current/60 hover:text-current focus:outline-none focus:ring-2 focus:ring-current/20"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
