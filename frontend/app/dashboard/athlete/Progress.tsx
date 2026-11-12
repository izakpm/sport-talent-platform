"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../../lib/api";
import {
  categories,
  colours,
  localDay,
  monday,
  shiftDay,
  weekDays,
  monthStart,
  monthWeeks,
  metricGroups,
  type Training,
  type Result,
} from "./progress-data";
import s from "./progress.module.css";
const shortDate = (day: string) =>
  new Date(day + "T12:00:00Z").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const num = (n: number) =>
  new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 }).format(n);
async function load<T>(path: string): Promise<T> {
  const r = await fetchWithAuth(path);
  if (!r?.ok) throw new Error("Unable to load");
  return r.json();
}
export default function Progress() {
  const [training, setTraining] = useState<Training[] | null>(null),
    [results, setResults] = useState<Result[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]),
    [busy, setBusy] = useState(true),
    [retry, setRetry] = useState(0),
    [now, setNow] = useState(0);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [offset, setOffset] = useState(0),
    [measure, setMeasure] = useState<"minutes" | "sessions">("minutes"),
    [day, setDay] = useState(""),
    [metric, setMetric] = useState("");
  useEffect(() => {
    let active = true;
    async function refresh() {
      const responses = await Promise.allSettled([
        load<Training[]>("/activities"),
        load<{ entries: Result[] }>("/athlete-profile"),
      ]);
      if (!active) return;
      const failed: string[] = [];
      if (responses[0].status === "fulfilled") setTraining(responses[0].value);
      else failed.push("training");
      if (responses[1].status === "fulfilled")
        setResults(responses[1].value.entries);
      else failed.push("performance");
      setErrors(failed);
      setNow(Date.now());
      setBusy(false);
    }
    void refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [retry]);
  const today = localDay(now || Date.now()),
    start =
      period === "week"
        ? shiftDay(monday(today), offset * 7)
        : monthStart(today, offset),
    days =
      period === "week"
        ? weekDays(training || [], start, now)
        : monthWeeks(training || [], start, now),
    entries = days.flatMap((d) => d.entries);
  const minutes = days.reduce((sum, d) => sum + d.minutes, 0),
    verified = entries.filter((e) => e.status === "verified").length;
  const selected =
    days.find((d) => d.date === day) ||
    days.find((d) => d.date <= today && d.end >= today) ||
    days[0];
  const maximum = Math.max(
    1,
    ...days.map((d) => (measure === "minutes" ? d.minutes : d.entries.length)),
  );
  const groups = metricGroups(results || [], today),
    group = groups.find((g) => g.key === metric) || groups[0];
  const points = group?.values || [],
    values = points.map((p) => Number(p.value)),
    min = Math.min(...values),
    max = Math.max(...values),
    range = max - min || Math.max(Math.abs(min) * 0.1, 1);
  const firstTime = points.length ? Date.parse(points[0].date) : 0,
    lastTime = points.length ? Date.parse(points[points.length - 1].date) : 0;
  const coords = points.map((p, i) => ({
    x:
      lastTime === firstTime
        ? 250
        : 48 +
          ((Date.parse(p.date) - firstTime) / (lastTime - firstTime)) * 404,
    y: max === min ? 110 : 176 - ((Number(p.value) - min) / range) * 132,
    p,
    i,
  }));
  return (
    <section
      className={s.section}
      aria-label="Training and performance progress"
    >
      <div className={s.heading}>
        <div>
          <p className={s.eyebrow}>YOUR WORK, MADE VISIBLE</p>
          <h2>Build your momentum.</h2>
        </div>
        <Link href="/dashboard/athlete/activities#training">
          Log training ↗
        </Link>
      </div>
      {errors.length > 0 && (
        <div role="alert" className={s.error}>
          Couldn’t refresh {errors.join(" and ")} data. Previously loaded data,
          if any, is still shown.{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Retry progress</button>
        </div>
      )}
      {busy && <p role="status">Loading your progress…</p>}
      <div className={s.periodToggle} role="group" aria-label="Training period">
        {(["week", "month"] as const).map((value) => (
          <button
            key={value}
            aria-pressed={period === value}
            onClick={() => {
              setPeriod(value);
              setOffset(0);
              setDay("");
            }}
          >
            {value === "week" ? "Weekly" : "Monthly"}
          </button>
        ))}
      </div>
      <div className={s.weekNav}>
        <strong>
          {period === "month"
            ? new Date(start + "T12:00:00Z").toLocaleDateString("en-ZA", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })
            : offset === 0
              ? "This week"
              : `${shortDate(start)} – ${shortDate(shiftDay(start, 6))}`}{" "}
          <small>
            {period === "week" ? "Mon–Sun · SAST" : "Calendar month · SAST"}
          </small>
        </strong>
        <div>
          <button
            aria-label={`Previous ${period}`}
            onClick={() => {
              setOffset((n) => n - 1);
              setDay("");
            }}
          >
            ←
          </button>
          <button disabled={offset === 0} onClick={() => setOffset(0)}>
            {period === "week" ? "This week" : "This month"}
          </button>
          <button
            aria-label={`Next ${period}`}
            disabled={offset === 0}
            onClick={() => {
              setOffset((n) => Math.min(0, n + 1));
              setDay("");
            }}
          >
            →
          </button>
        </div>
      </div>
      <div className={s.summaries}>
        {[
          ["Training hours", num(minutes / 60), "Completed activity log"],
          [
            "Sessions logged",
            String(entries.length),
            `Completed this ${period}`,
          ],
          ["Coach-verified", String(verified), "Of these logged sessions"],
        ].map(([label, value, note]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{training === null ? "—" : value}</strong>
            <small>
              {label === "Sessions logged" && offset !== 0
                ? `Completed in selected ${period}`
                : note}
            </small>
          </article>
        ))}
      </div>
      <div className={s.charts}>
        <article className={s.card}>
          <div className={s.heading}>
            <h3>Your training {period}</h3>
            <div className={s.toggle} aria-label="Chart measure">
              <button
                aria-pressed={measure === "minutes"}
                onClick={() => setMeasure("minutes")}
              >
                Time
              </button>
              <button
                aria-pressed={measure === "sessions"}
                onClick={() => setMeasure("sessions")}
              >
                Sessions
              </button>
            </div>
          </div>
          <p className={s.note}>
            Completed activity-log entries only. Scheduled sessions and team
            attendance aren’t added again.
          </p>
          {period === "month" && (
            <p className={s.note}>
              Each bar totals a calendar week within this month. Weeks at the
              edges include only this month’s dates.
            </p>
          )}
          {training !== null ? (
            <>
              <div className={s.axis}>
                {measure === "minutes"
                  ? "Minutes trained"
                  : "Sessions completed"}{" "}
                · peak {num(maximum === 1 && !entries.length ? 0 : maximum)}
              </div>
              <div
                className={s.bars}
                style={{
                  gridTemplateColumns: `repeat(${days.length},minmax(0,1fr))`,
                }}
              >
                {days.map((d) => {
                  const future = d.date > today;
                  const total =
                    measure === "minutes" ? d.minutes : d.entries.length;
                  return (
                    <button
                      key={d.date}
                      className={s.day}
                      aria-pressed={selected.date === d.date}
                      aria-label={`${shortDate(d.date)}${period === "month" ? ` – ${shortDate(d.end)}` : ""}: ${d.entries.length} sessions, ${d.minutes} minutes${future ? ", future day" : ""}`}
                      onClick={() => setDay(d.date)}
                    >
                      <span className={s.amount}>
                        {future ? "—" : num(total)}
                      </span>
                      <span className={s.track}>
                        {d.groups.map((items, index) => {
                          const v =
                            measure === "minutes"
                              ? items.reduce(
                                  (sum, r) => sum + Number(r.duration_minutes),
                                  0,
                                )
                              : items.length;
                          return v > 0 ? (
                            <span
                              key={categories[index]}
                              style={{
                                height: `${(v / maximum) * 100}%`,
                                background: colours[index],
                              }}
                            />
                          ) : null;
                        })}
                      </span>
                      <span>
                        {period === "month"
                          ? d.date === d.end
                            ? Number(d.date.slice(-2))
                            : `${Number(d.date.slice(-2))}–${Number(d.end.slice(-2))}`
                          : new Date(d.date + "T12:00:00Z").toLocaleDateString(
                              "en-ZA",
                              { weekday: "short", timeZone: "UTC" },
                            )}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className={s.legend}>
                {categories.map((c, i) => (
                  <span key={c}>
                    <i style={{ background: colours[i] }} />
                    {c === "Fitness / conditioning"
                      ? "Fitness"
                      : c === "Gym / strength"
                        ? "Gym"
                        : c}
                  </span>
                ))}
              </div>
              {!entries.length && (
                <p className={s.empty}>
                  No completed training logged for this {period}.{" "}
                  <Link href="/dashboard/athlete/activities#training">
                    Add an activity ↗
                  </Link>
                </p>
              )}
              <div className={s.detail} aria-live="polite">
                <strong>
                  {shortDate(selected.date)}
                  {period === "month" ? ` – ${shortDate(selected.end)}` : ""}
                </strong>
                {selected.entries.length ? (
                  <ul>
                    {selected.entries.map((e) => (
                      <li key={e.id}>
                        <span>
                          {e.title}
                          <small>
                            {period === "month" && `${shortDate(e.date)} · `}
                            {e.training_kind} ·{" "}
                            {e.status === "verified"
                              ? "Coach-verified"
                              : e.status === "legacy_verified"
                                ? "Previously verified"
                                : e.status === "pending"
                                  ? "Verification pending"
                                  : e.status === "declined"
                                    ? "Verification declined"
                                    : "Self-reported"}
                          </small>
                        </span>
                        <b>{num(Number(e.duration_minutes))} min</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    {selected.date > today
                      ? period === "week"
                        ? "This day is still ahead."
                        : "This week is still ahead."
                      : "No completed activity logged."}
                  </p>
                )}
              </div>
            </>
          ) : (
            !busy && (
              <p>Training data is unavailable. Use Retry progress above.</p>
            )
          )}
        </article>
        <article className={s.card}>
          <div className={s.heading}>
            <h3>Your performance</h3>
            <Link href="/dashboard/profile#metric">Record result ↗</Link>
          </div>
          <p className={s.note}>
            Your latest 12 results per metric. Self-reported; compare similar
            test conditions.
          </p>
          {group ? (
            <>
              <label className={s.select}>
                Performance metric
                <select
                  value={group.key}
                  onChange={(e) => setMetric(e.target.value)}
                >
                  {groups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.title} ({g.unit})
                    </option>
                  ))}
                </select>
              </label>
              <div className={s.result}>
                <strong>
                  {num(values[values.length - 1])}
                  <small> {group.unit}</small>
                </strong>
                <span>
                  Latest · {shortDate(points[points.length - 1].date)}
                </span>
              </div>
              {points.length > 1 ? (
                <>
                  <svg
                    viewBox="0 0 500 220"
                    className={s.trend}
                    role="img"
                    aria-label={`${group.title}: ${points.length} results from ${num(values[0])} to ${num(values[values.length - 1])} ${group.unit}. Full values in result history below.`}
                  >
                    <line x1="48" x2="452" y1="176" y2="176" stroke="#dce4e8" />
                    <line
                      x1="48"
                      x2="452"
                      y1="44"
                      y2="44"
                      stroke="#dce4e8"
                      strokeDasharray="4 4"
                    />
                    <text x="4" y="48">
                      {num(max)}
                    </text>
                    <text x="4" y="180">
                      {num(min)}
                    </text>
                    <polyline
                      points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
                      fill="none"
                      stroke="#0b1f2e"
                      strokeWidth="3"
                    />
                    {coords.map((c) => (
                      <circle
                        key={c.p.id}
                        cx={c.x}
                        cy={c.y}
                        r="5"
                        fill="#ffca05"
                        stroke="#0b1f2e"
                      >
                        <title>
                          {shortDate(c.p.date)}: {num(Number(c.p.value))}{" "}
                          {group.unit}
                        </title>
                      </circle>
                    ))}
                    <text x="48" y="210">
                      {shortDate(points[0].date)}
                    </text>
                    <text x="452" y="210" textAnchor="end">
                      {shortDate(points[points.length - 1].date)}
                    </text>
                  </svg>
                  <p className={s.note}>
                    Change across displayed results:{" "}
                    {values[values.length - 1] - values[0] > 0 ? "+" : ""}
                    {num(values[values.length - 1] - values[0])} {group.unit}.
                    Higher isn’t always better.
                  </p>
                </>
              ) : (
                <p className={s.empty}>
                  Your baseline is saved. Add another result to see your trend.
                </p>
              )}
              <details className={s.history}>
                <summary>View result history ({points.length})</summary>
                <table>
                  <caption>
                    {group.title} · {group.unit}
                  </caption>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...points].reverse().map((p) => (
                      <tr key={p.id}>
                        <td>{p.date}</td>
                        <td>
                          {num(Number(p.value))} {group.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          ) : results !== null ? (
            <div className={s.empty}>
              <h4>Start with your first benchmark.</h4>
              <p>
                Record a strength or fitness result in your profile. Your
                progress will appear here.
              </p>
              <Link href="/dashboard/profile#metric">
                Record your first result ↗
              </Link>
            </div>
          ) : (
            !busy && (
              <p>Performance data is unavailable. Use Retry progress above.</p>
            )
          )}
        </article>
      </div>
    </section>
  );
}
