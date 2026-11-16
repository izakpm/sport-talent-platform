import type { TrainingActivity } from "../../team-hub/training-api";
import { trainingDate } from "../../team-hub/training-api";
import s from "./training-summary.module.css";

const duration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
export default function TrainingSummary({
  rows,
  loaded,
  filtered,
  from,
  to,
}: {
  rows: TrainingActivity[];
  loaded: boolean;
  filtered: boolean;
  from: string;
  to: string;
}) {
  const timed = rows.filter(
    (r) =>
      r.duration_minutes != null &&
      Number.isFinite(r.duration_minutes) &&
      r.duration_minutes >= 0,
  );
  const minutes = timed.reduce((n, r) => n + r.duration_minutes!, 0);
  const verified = rows.filter((r) =>
    ["verified", "legacy_verified"].includes(r.status),
  );
  const pending = rows.filter((r) => r.status === "pending").length;
  const self = rows.filter((r) => r.status === "self_reported").length;
  const declined = rows.filter((r) => r.status === "declined").length;
  const days = new Set(rows.map((r) => r.date).filter(Boolean)).size;
  const percent = rows.length
    ? Math.round((verified.length / rows.length) * 100)
    : 0;
  const types = Object.entries(
    rows.reduce<Record<string, number>>((groups, row) => {
      const key = row.training_kind || "Other";
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {}),
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const period =
    from && to
      ? `${trainingDate(from)} – ${trainingDate(to)}`
      : from
        ? `From ${trainingDate(from)}`
        : to
          ? `Through ${trainingDate(to)}`
          : "All dates";
  return (
    <section
      className={s.summary}
      aria-label="Filtered training summary"
      aria-busy={!loaded}
    >
      <header className={s.heading}>
        <div>
          <p className={s.eyebrow}>YOUR WORK, IN NUMBERS</p>
          <h3>
            {filtered ? "Your selected training" : "Your training at a glance"}
          </h3>
        </div>
        <p className={s.scope}>
          {period}
          <span>
            {filtered ? "All active filters applied" : "All logged activities"}
          </span>
        </p>
      </header>
      <dl className={s.stats}>
        <div>
          <dt>Sessions logged</dt>
          <dd>{loaded ? rows.length : "—"}</dd>
          <small>
            {loaded
              ? `${days} training ${days === 1 ? "day" : "days"}`
              : "Loading records"}
          </small>
        </div>
        <div>
          <dt>Time trained</dt>
          <dd>{loaded ? duration(minutes) : "—"}</dd>
          <small>
            {loaded && timed.length
              ? `${Math.round(minutes / timed.length)} min average session`
              : "No duration recorded"}
          </small>
        </div>
        <div>
          <dt>Verified sessions</dt>
          <dd>{loaded ? verified.length : "—"}</dd>
          <small>
            {loaded && rows.length
              ? `${percent}% of selected sessions`
              : "No sessions to verify"}
          </small>
        </div>
        <div>
          <dt>Awaiting coach</dt>
          <dd>{loaded ? pending : "—"}</dd>
          <small>Verification requests pending</small>
        </div>
      </dl>
      {loaded && rows.length > 0 && (
        <div className={s.details}>
          <div>
            <div className={s.detailHeading}>
              <h4>Verification progress</h4>
              <span>
                {verified.length} of {rows.length} sessions
              </span>
            </div>
            <progress
              className={s.progress}
              value={verified.length}
              max={rows.length}
              aria-label="Verified share of selected sessions"
            />
            <p className={s.note}>
              {self} self-reported · {pending} awaiting coach · {declined}{" "}
              changes requested
            </p>
            <p className={s.note}>
              Includes coach-verified and previously verified records.
            </p>
          </div>
          <div>
            <div className={s.detailHeading}>
              <h4>Training mix</h4>
              <span>By session count</span>
            </div>
            <div className={s.mix} aria-hidden="true">
              {types.map(([type, count], i) => (
                <span
                  key={type}
                  style={{
                    flex: count,
                    background: palette[i % palette.length],
                  }}
                />
              ))}
            </div>
            <ul className={s.legend}>
              {types.map(([type, count], i) => (
                <li key={type}>
                  <i
                    aria-hidden="true"
                    style={{ background: palette[i % palette.length] }}
                  />
                  {type}
                  <b>{count}</b>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {loaded && !rows.length && (
        <p className={s.note}>
          {filtered
            ? "No activities match these filters. Adjust or clear them to see your training."
            : "Log your first session to start building your training record."}
        </p>
      )}
      {loaded && timed.length < rows.length && (
        <p className={s.note}>
          Missing duration: {rows.length - timed.length}. Time and average use
          recorded durations only.
        </p>
      )}
      <p className={s.footnote}>
        Based on your training log. Scheduled sessions and team attendance are
        not added again.
      </p>
    </section>
  );
}
const palette = [
  "#ffca05",
  "#79b8c5",
  "#cbd8e1",
  "#b8a4dd",
  "#93bca1",
  "#e9a87c",
  "#a1abb5",
];
