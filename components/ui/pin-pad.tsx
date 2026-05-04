"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface PINPadProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

export function PINPad({
  value,
  onChange,
  length = 4,
  onComplete,
  disabled = false,
  className,
}: PINPadProps) {
  function pushDigit(digit: string) {
    if (disabled || value.length >= length) return;
    const next = `${value}${digit}`;
    onChange(next);
    if (next.length === length) onComplete?.(next);
  }

  function removeDigit() {
    if (disabled) return;
    onChange(value.slice(0, -1));
  }

  return (
    <div className={cn("mx-auto w-full max-w-[280px]", className)}>
      <div
        className="mb-6 flex justify-center gap-3"
        aria-label={`${value.length} of ${length} PIN digits entered`}
      >
        {Array.from({ length }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-3 w-3 rounded-full border border-primary transition",
              index < value.length ? "bg-primary" : "bg-bg-canvas",
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key, index) => {
          if (!key) return <span key={`empty-${index}`} />;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() =>
                key === "delete" ? removeDigit() : pushDigit(key)
              }
              className="flex h-14 items-center justify-center rounded-full bg-bg-canvas text-xl font-semibold text-text-primary shadow-card transition hover:bg-primary-subtle focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={key === "delete" ? "Delete digit" : `Digit ${key}`}
            >
              {key === "delete" ? (
                <Delete className="h-5 w-5" aria-hidden />
              ) : (
                key
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
