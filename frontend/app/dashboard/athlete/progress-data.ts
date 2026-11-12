export type Training = {
  id: string;
  title: string;
  date: string;
  time: string;
  duration_minutes: number | null;
  training_kind: string;
  status: string;
};
export type Result = {
  id: string;
  kind: string;
  title: string;
  date: string;
  value: number | null;
  unit: string | null;
};
export const categories = [
  "Gym / strength",
  "Practice",
  "Fitness / conditioning",
  "Match",
  "Other",
] as const;
export const colours = ["#0b1f2e", "#ffca05", "#287f8c", "#7061a3", "#97aab5"];
function category(kind: string) {
  const legacy: Record<string, string> = {
    "Gym Session": "Gym / strength",
    "Practice Session": "Practice",
    "Conditioning Session": "Fitness / conditioning",
    "Match / Game": "Match",
  };
  return (
    legacy[kind] ||
    (categories.includes(kind as (typeof categories)[number]) ? kind : "Other")
  );
}
export const localDay = (now: number) =>
  new Date(now).toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
export const shiftDay = (day: string, delta: number) =>
  new Date(Date.parse(day + "T12:00:00Z") + delta * 86400000)
    .toISOString()
    .slice(0, 10);
export function monday(day: string) {
  return shiftDay(day, -((new Date(day + "T12:00:00Z").getUTCDay() + 6) % 7));
}
export function completed(rows: Training[], now: number) {
  return rows.filter(
    (r) =>
      r.date &&
      r.time &&
      Number.isFinite(Number(r.duration_minutes)) &&
      Number(r.duration_minutes) > 0 &&
      Date.parse(`${r.date}T${r.time}+02:00`) +
        Number(r.duration_minutes) * 60000 <=
        now,
  );
}
export function weekDays(rows: Training[], start: string, now: number) {
  const valid = completed(rows, now);
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDay(start, index),
      entries = valid.filter((r) => r.date === date);
    return {
      date,
      entries,
      minutes: entries.reduce((sum, r) => sum + Number(r.duration_minutes), 0),
      groups: categories.map((kind) =>
        entries.filter((r) => category(r.training_kind) === kind),
      ),
    };
  });
}
export function metricGroups(rows: Result[], today: string) {
  const groups = new Map<string, Result[]>();
  for (const r of rows) {
    if (
      r.kind !== "metric" ||
      !r.date ||
      r.date > today ||
      r.value === null ||
      !Number.isFinite(Number(r.value))
    )
      continue;
    const key = JSON.stringify([r.title, r.unit || ""]);
    groups.set(key, [
      ...(groups.get(key) || []),
      { ...r, value: Number(r.value) },
    ]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => ({
      key,
      title: values[0].title,
      unit: values[0].unit || "",
      values: values
        .sort(
          (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
        )
        .slice(-12),
    }));
}
