import { type HubEvent } from "../../team-hub/api";
export type CalendarEvent = HubEvent & {
  source?: "team" | "personal";
  kind: string;
  notes: string;
  timezone: string;
};
export const KINDS: Record<string, string> = {
  practice: "Practice",
  gym: "Gym",
  video: "Video session",
  match: "Match",
  fitness: "Fitness test",
  recovery: "Recovery",
};
export function monthDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) =>
    i >= offset && i < offset + days
      ? `${month}-${String(i - offset + 1).padStart(2, "0")}`
      : null,
  );
}
export function monthLabel(month: string) {
  return new Date(month + "-01T12:00:00Z").toLocaleDateString("en-ZA", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function dayLabel(date: string) {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function filterEvents(
  events: CalendarEvent[],
  team: string,
  kind: string,
  upcoming: boolean,
  cancelled: boolean,
  now: number,
) {
  return events.filter(
    (e) =>
      (!team || e.team_id === team) &&
      (!kind || e.kind === kind) &&
      (!upcoming || Date.parse(e.ends_at) >= now) &&
      (cancelled || !e.cancelled),
  );
}
