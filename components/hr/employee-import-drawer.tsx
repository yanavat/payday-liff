"use client";

import { type DragEvent, useRef, useState } from "react";
import { Download, FileUp, Loader2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { SlideDrawer } from "@/components/ui/slide-drawer";
import { useToast } from "@/components/ui/toast";
import { useEmployeeActions } from "@/lib/api/hooks";
import { getApiErrorMessage } from "@/lib/api/errors";
import type { EmployeeImportSummaryDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface EmployeeImportDrawerProps {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}

type Step = "upload" | "review";

function downloadTextFile(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function errorsToCsv(summary: EmployeeImportSummaryDto) {
  const rows = [["row", "reason"]];
  for (const error of summary.errors) {
    rows.push([String(error.row), error.reason]);
  }
  return rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
}

export function EmployeeImportDrawer({
  open,
  onClose,
  onImported,
}: EmployeeImportDrawerProps) {
  const t = useTranslations("employeeImport");
  const tc = useTranslations("common");
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState<EmployeeImportSummaryDto | null>(null);
  const [fileName, setFileName] = useState("");
  const {
    importCsv,
    importJson,
    getImportTemplate,
    loading,
    error,
  } = useEmployeeActions();

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".csv") && !name.endsWith(".json")) {
      toast({ variant: "error", message: t("invalidFile") });
      return;
    }

    setFileName(file.name);
    const result = name.endsWith(".json")
      ? await uploadJson(file)
      : await importCsv(file);

    if (result) {
      setSummary(result);
      setStep("review");
    } else if (error) {
      toast({ variant: "error", message: getApiErrorMessage(error, tc) });
    }
  }

  async function uploadJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const rows = Array.isArray(parsed)
        ? parsed
        : typeof parsed === "object" &&
            parsed !== null &&
            "employees" in parsed &&
            Array.isArray((parsed as { employees?: unknown }).employees)
          ? (parsed as { employees: unknown[] }).employees
          : null;

      if (!rows) {
        toast({ variant: "error", message: t("invalidJson") });
        return null;
      }

      return importJson(rows);
    } catch {
      toast({ variant: "error", message: t("invalidJson") });
      return null;
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files.item(0);
    if (file) void handleFile(file);
  }

  async function handleTemplateDownload() {
    const template = await getImportTemplate();
    if (template) {
      downloadTextFile("employee-import-template.csv", template, "text/csv;charset=utf-8");
    } else if (error) {
      toast({ variant: "error", message: getApiErrorMessage(error, tc) });
    }
  }

  function handleConfirm() {
    if (!summary || summary.success === 0) return;
    toast({
      variant: "success",
      message: t("successToast", { count: summary.success }),
    });
    onImported(summary.success);
    setStep("upload");
    setSummary(null);
    setFileName("");
    onClose();
  }

  function handleClose() {
    if (!loading) onClose();
  }

  return (
    <SlideDrawer
      open={open}
      onClose={handleClose}
      title={t("title")}
      footer={
        step === "review" && summary ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("upload")}
              disabled={loading}
              className="h-9 rounded-md border border-border bg-bg-canvas px-4 text-sm font-medium text-text-primary hover:bg-bg-secondary disabled:opacity-50"
            >
              {tc("back")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || summary.success === 0}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t("confirmImport")}
            </button>
          </div>
        ) : null
      }
    >
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={cn(
              "flex min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-secondary px-6 py-8 text-center transition",
              dragActive && "border-primary bg-primary-subtle",
            )}
          >
            <UploadCloud className="h-9 w-9 text-primary-dark" aria-hidden />
            <h3 className="mt-3 text-base font-semibold text-text-primary">
              {t("dropTitle")}
            </h3>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              {t("dropDescription")}
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <FileUp className="h-4 w-4" aria-hidden />
              {t("browse")}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
                event.currentTarget.value = "";
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleTemplateDownload}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-canvas px-3 text-sm font-medium text-text-primary hover:bg-bg-secondary disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden />
            {t("downloadTemplate")}
          </button>

          {loading && (
            <div className="rounded-md border border-border bg-bg-secondary p-3">
              <div className="mb-2 flex items-center justify-between text-sm text-text-secondary">
                <span>{t("uploading")}</span>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-canvas">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          )}
        </div>
      )}

      {step === "review" && summary && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-text-primary">{fileName}</p>
            <p className="mt-1 text-caption text-text-muted">{t("reviewDescription")}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label={t("total")} value={summary.total} />
            <SummaryCard label={t("valid")} value={summary.success} />
            <SummaryCard label={t("failed")} value={summary.failed} tone="danger" />
          </div>

          {summary.failed > 0 && (
            <section className="rounded-lg border border-border bg-bg-canvas">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-text-primary">
                  {t("failedRows")}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      "employee-import-errors.csv",
                      errorsToCsv(summary),
                      "text/csv;charset=utf-8",
                    )
                  }
                  className="text-sm font-medium text-primary-dark"
                >
                  {t("downloadErrors")}
                </button>
              </div>
              <div className="max-h-[240px] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="h-9 bg-bg-secondary text-left text-xs font-semibold text-text-muted">
                      <th className="px-4">{t("row")}</th>
                      <th className="px-4">{t("reason")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.errors.map((item) => (
                      <tr key={`${item.row}-${item.reason}`} className="border-t border-border-light">
                        <td className="px-4 py-3 font-number text-sm text-text-primary">
                          {item.row}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-secondary">
                          {item.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </SlideDrawer>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-secondary p-3">
      <div className="text-caption text-text-muted">{label}</div>
      <div
        className={cn(
          "mt-1 font-number text-xl font-semibold text-text-primary",
          tone === "danger" && value > 0 && "text-red-700",
        )}
      >
        {value}
      </div>
    </div>
  );
}
