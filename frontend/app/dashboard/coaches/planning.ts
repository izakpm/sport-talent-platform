import { fetchWithAuth } from "../../lib/api";

export type Team = {
  id: string;
  name: string;
  age_group: string;
  venue: string;
  sport: string;
  timezone: string;
};
export type Session = {
  id: string;
  team_id: string;
  team_name: string;
  title: string;
  kind: string;
  date: string;
  start_time: string;
  end_time: string;
  venue: string;
  notes: string;
  series_id?: string;
};
export const SESSION_TYPES = [
  {
    id: "practice",
    label: "Practice",
    title: "Rugby practice",
    duration: 90,
    color: "#16745f",
    soft: "#eaf5ef",
    mark: "P",
  },
  {
    id: "gym",
    label: "Gym",
    title: "Strength & conditioning",
    duration: 60,
    color: "#7650a3",
    soft: "#f2edfa",
    mark: "G",
  },
  {
    id: "video",
    label: "Video",
    title: "Video review",
    duration: 45,
    color: "#3464a3",
    soft: "#edf3fc",
    mark: "V",
  },
  {
    id: "match",
    label: "Match",
    title: "Match day",
    duration: 120,
    color: "#b65e1d",
    soft: "#fff3e7",
    mark: "M",
  },
  {
    id: "fitness",
    label: "Fitness test",
    title: "Fitness testing",
    duration: 60,
    color: "#ad4565",
    soft: "#fceef3",
    mark: "F",
  },
  {
    id: "recovery",
    label: "Recovery",
    title: "Recovery & mobility",
    duration: 45,
    color: "#52707a",
    soft: "#edf3f5",
    mark: "R",
  },
];
export const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];
export function todayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function monthBounds(month: string) {
  const [year, number] = month.split("-").map(Number);
  return {
    from: `${month}-01`,
    to: `${month}-${new Date(Date.UTC(year, number, 0)).getUTCDate()}`,
  };
}
export function shiftMonth(month: string, offset: number) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + offset, 1)).toISOString().slice(0, 7);
}
export function displayDate(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  },
) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-ZA", {
    ...options,
    timeZone: "UTC",
  });
}
export function calendarDays(month: string): (string | null)[] {
  const { from, to } = monthBounds(month);
  const offset = (new Date(`${from}T12:00:00Z`).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= Number(to.slice(-2)); d++)
    cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
export function recurrenceCount(
  start: string,
  until: string,
  weekdays: number[],
) {
  if (!start || !until || until < start) return 0;
  let count = 0;
  for (
    let t = Date.parse(start);
    t <= Math.min(Date.parse(until), Date.parse(start) + 92 * 86400000);
    t += 86400000
  ) {
    if (weekdays.includes(new Date(t).getUTCDay())) count++;
  }
  return count;
}
export async function planningRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetchWithAuth(`/coach-planning${path}`, options);
  if (!res) throw new Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to save. Please try again.",
    );
  return data as T;
}
