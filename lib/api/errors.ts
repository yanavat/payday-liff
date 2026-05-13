import type { ApiError } from "./types";

type TranslateFn = (key: string) => string;

export function getApiErrorMessage(
  error: ApiError | Error | null | unknown,
  t: TranslateFn,
): string {
  if (!error) return "";

  const apiError = error as ApiError;

  if (apiError.statusCode === 401) return t("common.sessionExpired");
  if (apiError.statusCode === 403) return t("common.noPermission");
  if (apiError.statusCode === 422) {
    const details = apiError.details as { message?: string } | undefined;
    return details?.message ?? t("common.error");
  }
  if (apiError.statusCode >= 500) return t("common.serverError");

  // Network error (fetch threw, no statusCode)
  if (!apiError.statusCode) return t("common.networkError");

  return apiError.message ?? t("common.error");
}
