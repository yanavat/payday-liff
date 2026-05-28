/**
 * Client-side helper to dispatch LINE notifications via the server-side API proxy.
 * Keeps the channel access token server-side while allowing the UI to trigger sends.
 */

import type { EWARequest, Employee } from "@/lib/api";
import type { TypedNotificationCommand } from "./notifications";

export async function sendNotification(
  cmd: TypedNotificationCommand,
): Promise<boolean> {
  try {
    const res = await fetch("/api/line/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
    });
    if (!res.ok) {
      console.error("[Notification Dispatch] API error:", res.status);
      return false;
    }
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[Notification Dispatch] exception:", err);
    return false;
  }
}

/**
 * Send a LINE push notification for a request status change.
 * Used by the HR dashboard when approving, rejecting, or disbursing.
 */
export async function notifyRequestStatusChange(
  type: "request_approved" | "request_rejected" | "disbursement_complete",
  request: EWARequest,
  employee: Employee,
  locale: "th" | "en" | "my" = "th",
): Promise<boolean> {
  return sendNotification({
    type,
    lineUserId: "", // resolved server-side from employee.id
    locale,
    request,
    employee,
  });
}
