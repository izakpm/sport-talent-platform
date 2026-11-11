import { fetchWithAuth } from "../../lib/api";
export async function hub<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const res = await fetchWithAuth(
    `/team-hub${path}`,
    body !== undefined || method
      ? {
          method: method || "POST",
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        }
      : undefined,
  );
  if (!res) throw new Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to complete that action. Please try again.",
    );
  return data;
}
export type HubTeam = { id: string; name: string; age_group: string };
export type HubEvent = {
  id: string;
  team_id: string;
  title: string;
  team_name: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  cancelled: boolean;
  starts_at: string;
  ends_at: string;
  attendance_status?: string;
  attendance_method?: string;
};
export const attendanceLabel = (status?: string, method?: string) =>
  status === "verified"
    ? method === "qr"
      ? "Checked in by QR"
      : "Verified by coach"
    : status === "pending"
      ? "Awaiting coach"
      : status === "declined"
        ? "Request declined"
        : status === "absent"
          ? "Absent"
          : "Not recorded";
export function notifyAttendance() {
  window.dispatchEvent(new Event("attendance-updated"));
}
