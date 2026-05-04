"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger";
  hasReasonInput?: boolean;
  reasonLabel?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  variant = "primary",
  hasReasonInput = false,
  reasonLabel = "เหตุผล",
  isLoading = false,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const reasonValid = !hasReasonInput || reason.trim().length >= 10;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    if (!open) return;
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-backdrop-fade-in items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-[400px] animate-scale-in rounded-lg bg-white p-6 shadow-modal">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-text-secondary">{message}</p>
        {hasReasonInput && (
          <label className="mt-4 block">
            <span className="text-label text-text-muted">{reasonLabel}</span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-md border border-border bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {!reasonValid && (
              <span className="mt-1 block text-caption text-red-600">
                กรุณาระบุอย่างน้อย 10 ตัวอักษร
              </span>
            )}
          </label>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-md border border-border bg-white px-4 text-sm font-medium text-text-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={!reasonValid || isLoading}
            onClick={() =>
              onConfirm(hasReasonInput ? reason.trim() : undefined)
            }
            className={cn(
              "h-9 rounded-md px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
              variant === "primary"
                ? "bg-primary hover:bg-primary-dark"
                : "bg-red-600 hover:bg-red-700",
            )}
          >
            {isLoading ? "กำลังดำเนินการ..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
