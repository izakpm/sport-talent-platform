import { fetchWithAuth } from "../../lib/api";
export type TrainingActivity = {
  id: string;
  title: string;
  sport: string;
  sport_id: string;
  training_kind: string;
  date: string;
  time: string;
  duration_minutes: number | null;
  effort: number | null;
  description: string;
  location: string;
  status: string;
  coach_id?: string;
  coach_name?: string;
  request_note?: string;
  review_note?: string;
  athlete_name?: string;
};
export type TrainingOptions = {
  sports: { id: string; name: string }[];
  kinds: string[];
  coaches: { id: string; name: string; teams: string }[];
};
export async function training<T>(
  path = "",
  method = "GET",
  body?: unknown,
): Promise<T> {
  const res = await fetchWithAuth("/activities" + path, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
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
export function trainingStatus(status: string) {
  return (
    (
      {
        self_reported: "Self-reported",
        pending: "Awaiting coach",
        verified: "Coach verified",
        declined: "Changes requested",
        legacy_verified: "Previously verified",
      } as Record<string, string>
    )[status] || "Self-reported"
  );
}
export const trainingDate = (date: string) =>
  date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date not recorded";
