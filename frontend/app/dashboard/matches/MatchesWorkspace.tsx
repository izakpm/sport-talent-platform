"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { hub } from "../team-hub/api";
import { Modal } from "../coaches/CoachWorkspace";
import { dayLabel } from "../athlete/calendar/calendar";
import s from "../coaches/workspace.module.css";
import m from "../athlete/matches/matches.module.css";
type Stats = {
  position: string;
  minutes: number | null;
  tries: number | null;
  tackles: number | null;
  conversions: number | null;
  penalties: number | null;
  video_url: string;
  notes: string;
};
export type Match = {
  id: string;
  team_id: string;
  team_name: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  ends_at: string;
  starts_at: string;
  venue: string;
  notes: string;
  timezone: string;
  sport: string;
  cancelled: boolean;
  result: {
    opponent: string;
    team_score: number;
    opponent_score: number;
  } | null;
  stats: Stats | null;
};
export const outcome = (r: NonNullable<Match["result"]>) =>
  r.team_score > r.opponent_score
    ? "Win"
    : r.team_score < r.opponent_score
      ? "Loss"
      : "Draw";
const metrics = [
  ["minutes", "Minutes played", 180],
  ["tries", "Tries", 50],
  ["tackles", "Tackles", 200],
  ["conversions", "Conversions", 100],
  ["penalties", "Penalty goals", 100],
] as const;
export default function MatchesWorkspace({
  coach = false,
}: {
  coach?: boolean;
}) {
  const [rows, setRows] = useState<Match[] | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0),
    [team, setTeam] = useState(""),
    [view, setView] = useState("all"),
    [editing, setEditing] = useState<Match | null>(null),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const data = await hub<Match[]>("/matches");
        if (active) {
          setRows(data);
          setError("");
          setNow(Date.now());
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [retry]);
  const filtered = (rows || []).filter((e) => !team || e.team_id === team);
  const upcoming = filtered
    .filter((e) => !e.cancelled && !e.result && Date.parse(e.ends_at) >= now)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const past = filtered
    .filter((e) => !e.cancelled && (e.result || Date.parse(e.ends_at) < now))
    .sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at));
  const cancelled = filtered.filter((e) => e.cancelled);
  const results = past.filter((e) => e.result);
  function saved(e: Match) {
    setRows((v) => v?.map((x) => (x.id === e.id ? e : x)) || [e]);
    setEditing(null);
    setNotice(
      coach
        ? "Team result saved. Linked athletes can now add their performance details."
        : "Your performance details have been saved.",
    );
  }
  function card(e: Match) {
    return (
      <article
        className={`${m.card} ${e.cancelled ? m.cancelled : ""}`}
        key={e.id}
      >
        <div className={m.dateTile}>
          <span>
            {new Date(e.date + "T12:00:00Z").toLocaleDateString("en-ZA", {
              month: "short",
              timeZone: "UTC",
            })}
          </span>
          <strong>{Number(e.date.slice(8))}</strong>
        </div>
        <div className={m.content}>
          <div className={m.cardTop}>
            <p className={m.team}>
              {e.team_name} · {e.sport}
            </p>
            <span className={e.cancelled ? m.cancelBadge : m.badge}>
              {e.cancelled
                ? "Cancelled"
                : e.result
                  ? "Coach-recorded result"
                  : Date.parse(e.ends_at) < now
                    ? "Awaiting result"
                    : "Upcoming"}
            </span>
          </div>
          <h3>
            {e.result ? `${e.team_name} vs ${e.result.opponent}` : e.title}
          </h3>
          <p className={m.details}>
            {dayLabel(e.date)} · {e.start_time}–{e.end_time} ({e.timezone})
          </p>
          <p className={m.venue}>{e.venue || "Venue to be confirmed"}</p>
          {e.result && (
            <div className={m.score} data-outcome={outcome(e.result)}>
              <strong>
                {e.result.team_score} – {e.result.opponent_score}
              </strong>
              <span>
                {outcome(e.result)}
                <small>{e.team_name} score first</small>
              </span>
            </div>
          )}
          {e.notes && (
            <details className={m.notes}>
              <summary>Coach’s match notes</summary>
              <p>{e.notes}</p>
            </details>
          )}
          {!coach && e.result && (
            <section className={m.performance} aria-label="My performance">
              <h4>
                My performance <span>Self-reported</span>
              </h4>
              {e.stats ? (
                <>
                  <p>{e.stats.position || "Position not added"}</p>
                  <dl className={m.metrics}>
                    {metrics.map(([key, label]) =>
                      e.stats?.[key] !== null &&
                      e.stats?.[key] !== undefined ? (
                        <div key={key}>
                          <dt>{label}</dt>
                          <dd>{e.stats[key]}</dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                  {e.stats.notes && (
                    <p className={m.personalNotes}>{e.stats.notes}</p>
                  )}
                  {e.stats.video_url &&
                    /^https?:\/\//i.test(e.stats.video_url) && (
                      <a
                        href={e.stats.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={s.secondary}
                      >
                        Watch my match video ↗
                      </a>
                    )}
                </>
              ) : (
                <p>
                  Add your position, performance stats and a video link from
                  this match.
                </p>
              )}
            </section>
          )}
          {!e.cancelled &&
            Date.parse(e.ends_at) < now &&
            (coach || e.result) && (
              <button
                className={coach ? s.primary : s.secondary}
                onClick={() => setEditing(e)}
              >
                {coach
                  ? e.result
                    ? "Edit result"
                    : "Record result"
                  : e.stats
                    ? "Edit my performance"
                    : "Add my performance"}
              </button>
            )}
          {!coach &&
            !e.result &&
            Date.parse(e.ends_at) < now &&
            !e.cancelled && (
              <p className={m.details}>
                Your coach needs to record the result before you can add your
                performance.
              </p>
            )}
        </div>
      </article>
    );
  }
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>MATCH DAY</p>
          <h1>{coach ? "Matches" : "My matches"}</h1>
          <p className={s.subtitle}>
            {coach
              ? "Capture the result. Keep your team’s season on record."
              : "Your results, your contribution and what comes next."}
          </p>
        </div>
        <Link
          className={s.primary}
          href={
            coach
              ? "/dashboard/coaches/schedule"
              : "/dashboard/athlete/calendar"
          }
        >
          {coach ? "Schedule a match" : "Open my calendar"} ↗
        </Link>
      </header>
      {notice && (
        <div className={s.notice} role="status">
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className={s.error} role="alert">
          <span>
            {error}
            {rows ? " Showing the last loaded matches." : ""}
          </span>
          <button
            className={s.secondary}
            onClick={() => setRetry((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      )}
      <section className={m.toolbar} aria-label="Match filters">
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {Array.from(
              new Map(
                (rows || []).map((e) => [e.team_id, e.team_name]),
              ).entries(),
            ).map(([id, name]) => (
              <option value={id} key={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Show
          <select value={view} onChange={(e) => setView(e.target.value)}>
            <option value="all">Results & upcoming</option>
            <option value="results">Previous matches</option>
            <option value="upcoming">Upcoming matches</option>
            <option value="cancelled">Cancelled matches</option>
          </select>
        </label>
      </section>
      {!rows && !error && (
        <div className={s.loading} role="status">
          Loading your matches…
        </div>
      )}
      {rows && (
        <>
          <section className={m.hero}>
            <div>
              <p className={m.kicker}>NEXT MATCH</p>
              <h2>{upcoming[0]?.title || "Ready for your next match."}</h2>
              <p>
                {upcoming[0]
                  ? `${upcoming[0].team_name} · ${dayLabel(upcoming[0].date)} · ${upcoming[0].start_time} (${upcoming[0].timezone})`
                  : "Your upcoming team fixtures will appear here."}
              </p>
              {upcoming[0] && (
                <p>{upcoming[0].venue || "Venue to be confirmed"}</p>
              )}
            </div>
            <div className={m.summary}>
              <strong>{results.length}</strong>
              <span>
                recorded {results.length === 1 ? "result" : "results"}
                <br />
                {results.filter((e) => outcome(e.result!) === "Win").length} W ·{" "}
                {results.filter((e) => outcome(e.result!) === "Loss").length} L
                · {results.filter((e) => outcome(e.result!) === "Draw").length}{" "}
                D
              </span>
            </div>
          </section>
          {(view === "all" || view === "results") && (
            <section>
              <div className={m.listHeading}>
                <h2>Previous matches</h2>
                <span>
                  {past.length} {past.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <div className={m.list}>
                {past.length ? (
                  past.map(card)
                ) : (
                  <div className={m.empty}>
                    <h3>No previous matches yet</h3>
                    <p>
                      Completed fixtures and coach-recorded{" "}
                      {results.length === 1 ? "result" : "results"} will appear
                      here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
          {(view === "all" || view === "upcoming") && (
            <section>
              <div className={m.listHeading}>
                <h2>Upcoming matches</h2>
                <span>
                  {upcoming.length}{" "}
                  {upcoming.length === 1 ? "fixture" : "fixtures"}
                </span>
              </div>
              <div className={m.list}>
                {upcoming.length ? (
                  upcoming.map(card)
                ) : (
                  <div className={m.empty}>
                    <h3>No upcoming matches</h3>
                    <p>
                      {coach
                        ? "Choose Match when creating a session in your team schedule."
                        : "Your coach’s scheduled team matches will appear here. Your personal plans remain in Calendar."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
          {view === "cancelled" && (
            <section>
              <div className={m.listHeading}>
                <h2>Cancelled matches</h2>
              </div>
              <div className={m.list}>
                {cancelled.length ? (
                  cancelled.map(card)
                ) : (
                  <div className={m.empty}>No cancelled matches.</div>
                )}
              </div>
            </section>
          )}
          {!coach && (
            <p className={m.footnote}>
              Team results are recorded by the coach. Personal stats and video
              links are self-reported and do not verify attendance.
            </p>
          )}
        </>
      )}
      {editing && (
        <MatchEditor
          match={editing}
          coach={coach}
          close={() => setEditing(null)}
          saved={saved}
        />
      )}
    </div>
  );
}
function MatchEditor({
  match,
  coach,
  close,
  saved,
}: {
  match: Match;
  coach: boolean;
  close: () => void;
  saved: (e: Match) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const body: Record<string, unknown> = coach
      ? {
          opponent: f.get("opponent"),
          team_score: Number(f.get("team_score")),
          opponent_score: Number(f.get("opponent_score")),
        }
      : {
          position: f.get("position"),
          video_url: f.get("video_url"),
          notes: f.get("notes"),
        };
    if (!coach)
      metrics.forEach(
        ([key]) => (body[key] = f.get(key) === "" ? null : Number(f.get(key))),
      );
    try {
      saved(
        await hub<Match>(
          `/matches/${match.id}/${coach ? "result" : "stats"}`,
          body,
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={coach ? "Record match result" : "My match performance"}
      description={
        coach
          ? `${match.team_name} · ${match.title}. Enter the final score from your team’s perspective.`
          : "Only add your own performance. These details are self-reported; a video link does not verify them."
      }
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset className={m.fields} disabled={busy}>
          {coach ? (
            <>
              <label>
                Opponent
                <input
                  name="opponent"
                  required
                  maxLength={120}
                  defaultValue={match.result?.opponent || ""}
                />
              </label>
              <div className={s.formRow}>
                <label>
                  {match.team_name} score
                  <input
                    name="team_score"
                    type="number"
                    min={0}
                    max={999}
                    step={1}
                    required
                    defaultValue={match.result?.team_score ?? ""}
                  />
                </label>
                <label>
                  Opponent score
                  <input
                    name="opponent_score"
                    type="number"
                    min={0}
                    max={999}
                    step={1}
                    required
                    defaultValue={match.result?.opponent_score ?? ""}
                  />
                </label>
              </div>
              <p className={s.muted}>
                Win, loss or draw is calculated from the scores. Saving updates
                the result for everyone in this team.
              </p>
            </>
          ) : (
            <>
              <label>
                Position played
                <input
                  name="position"
                  maxLength={80}
                  placeholder="e.g. Eighth man"
                  defaultValue={match.stats?.position || ""}
                />
              </label>
              <div className={m.statsFields}>
                {metrics.map(([key, label, max]) => (
                  <label key={key}>
                    {label}
                    <input
                      name={key}
                      type="number"
                      min={0}
                      max={max}
                      step={1}
                      placeholder="Not recorded"
                      defaultValue={match.stats?.[key] ?? ""}
                    />
                  </label>
                ))}
              </div>
              <label>
                Match or highlights video
                <input
                  name="video_url"
                  type="url"
                  maxLength={2000}
                  placeholder="https://…"
                  defaultValue={match.stats?.video_url || ""}
                />
              </label>
              <label>
                My match notes
                <textarea
                  name="notes"
                  maxLength={2000}
                  rows={3}
                  defaultValue={match.stats?.notes || ""}
                />
              </label>
              <p className={s.muted}>
                Leave stats blank if you did not record them. Enter 0 only for a
                recorded zero.
              </p>
            </>
          )}
          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}
          <div className={m.editorActions}>
            <button className={s.secondary} type="button" onClick={close}>
              Cancel
            </button>
            <button className={s.primary} type="submit">
              {busy ? "Saving…" : coach ? "Save result" : "Save my performance"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
