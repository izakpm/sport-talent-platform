import {
  completed,
  weekDays,
  metricGroups,
  monday,
  localDay,
  type Training,
} from "./progress-data";
const now = Date.parse("2026-11-12T12:00:00Z");
const a: Training = {
  id: "a",
  title: "Gym",
  date: "2026-11-09",
  time: "16:00",
  duration_minutes: 60,
  training_kind: "Gym / strength",
  status: "verified",
};
it("uses Monday weeks in SAST across month and year boundaries", () => {
  expect(monday("2026-01-01")).toBe("2025-12-29");
  expect(localDay(Date.parse("2026-11-08T23:00:00Z"))).toBe("2026-11-09");
});
it("counts only completed dated activities and groups durations without attendance duplication", () => {
  const rows = [
    a,
    { ...a, id: "b", duration_minutes: 30, training_kind: "Practice" },
    { ...a, id: "future", date: "2026-11-13" },
    { ...a, id: "ongoing", date: "2026-11-12", time: "13:45" },
    { ...a, id: "bad", duration_minutes: null },
    { ...a, id: "undated", date: "" },
  ];
  expect(completed(rows, now)).toHaveLength(2);
  const days = weekDays(rows, "2026-11-09", now);
  expect(days).toHaveLength(7);
  expect(days[0].minutes).toBe(90);
  expect(days[0].groups[0]).toHaveLength(1);
  expect(days[0].groups[1]).toHaveLength(1);
  expect(days[1].minutes).toBe(0);
});
it("separates units, orders real measurements and excludes future or missing values", () => {
  const r = {
    id: "1",
    kind: "metric",
    title: "Bench press",
    date: "2026-11-10",
    value: 80,
    unit: "kg",
  };
  const groups = metricGroups(
    [
      r,
      { ...r, id: "2", date: "2026-11-01", value: 70 },
      { ...r, id: "3", unit: "lb", value: 180 },
      { ...r, id: "4", value: null },
      { ...r, id: "5", date: "2027-01-01" },
      { ...r, id: "6", kind: "achievement" },
    ],
    "2026-11-12",
  );
  expect(groups).toHaveLength(2);
  expect(
    groups.find((g) => g.unit === "kg")!.values.map((r) => r.value),
  ).toEqual([70, 80]);
});
it("groups legacy session names with current training categories", () => {
  const days = weekDays(
    [
      { ...a, training_kind: "Practice Session" },
      { ...a, id: "b", training_kind: "Gym Session" },
      { ...a, id: "c", training_kind: "Conditioning Session" },
    ],
    "2026-11-09",
    now,
  );
  expect(days[0].groups.map((g) => g.length)).toEqual([1, 1, 1, 0, 0]);
});
it("keeps the latest twelve measurements without merging equal-date results", () => {
  const rows = Array.from({ length: 14 }, (_, i) => ({
    id: String(i),
    kind: "metric",
    title: "Sprint",
    date: `2026-10-${String(i + 1).padStart(2, "0")}`,
    value: 5,
    unit: "s",
  }));
  const g = metricGroups(rows, "2026-11-12")[0];
  expect(g.values).toHaveLength(12);
  expect(g.values[0].date).toBe("2026-10-03");
});
