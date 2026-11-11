"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hub, type HubTeam } from "../../team-hub/api";
import { todayDate, shiftMonth } from "../../coaches/planning";
import { dayLabel, monthLabel, type CalendarEvent } from "../calendar/calendar";
import s from "../../coaches/workspace.module.css";
import m from "./matches.module.css";

export default function AthleteMatches() {
  const [month, setMonth] = useState(() => todayDate().slice(0, 7));
  const [team, setTeam] = useState("");
  const [status, setStatus] = useState("all");
  const [data, setData] = useState<{
    month: string;
    events: CalendarEvent[];
    teams: HubTeam[];
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    async function refresh() {
      try {
        const [events, teams] = await Promise.all([
          hub<CalendarEvent[]>("/calendar?month=" + month),
          hub<HubTeam[]>("/teams"),
        ]);
        if (active) {
          setData({
            month,
            events: events
              .filter((e) => e.kind === "match")
              .sort(
                (a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at),
              ),
            teams,
          });
          setTeam((previous) =>
            !previous ||
            previous === "personal" ||
            teams.some((t) => t.id === previous)
              ? previous
              : "",
          );
          setNow(Date.now());
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [month, retry]);
  const current = data?.month === month ? data : null;
  const matches = (current?.events || []).filter(
    (e) => !team || e.team_id === team,
  );
  const upcoming = matches.filter(
    (e) => !e.cancelled && Date.parse(e.ends_at) >= now,
  );
  const next = upcoming[0];
  const visible = matches.filter(
    (e) =>
      status === "all" ||
      (status === "cancelled"
        ? e.cancelled
        : !e.cancelled &&
          (status === "upcoming"
            ? Date.parse(e.ends_at) >= now
            : Date.parse(e.ends_at) < now)),
  );
  function label(e: CalendarEvent) {
    return e.cancelled
      ? "Cancelled"
      : Date.parse(e.ends_at) < now
        ? "Past fixture"
        : Date.parse(e.starts_at) <= now
          ? "In progress"
          : "Upcoming";
  }
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>MATCH DAY</p>
          <h1>My matches</h1>
          <p className={s.subtitle}>
            Know where to be. Be ready when the whistle blows.
          </p>
        </div>
        <Link className={s.primary} href="/dashboard/athlete/calendar">
          Open my calendar <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <section className={m.toolbar} aria-label="Match filters">
        <div className={m.monthControls}>
          <button
            className={s.secondary}
            aria-label="Previous month"
            disabled={month === "1900-01"}
            onClick={() => setMonth(shiftMonth(month, -1))}
          >
            ←
          </button>
          <label className={m.monthLabel}>
            Month
            <input
              aria-label="Match month"
              type="month"
              min="1900-01"
              max="2099-12"
              value={month}
              onChange={(e) => {
                if (/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(e.target.value))
                  setMonth(e.target.value);
              }}
            />
          </label>
          <button
            className={s.secondary}
            aria-label="Next month"
            disabled={month === "2099-12"}
            onClick={() => setMonth(shiftMonth(month, 1))}
          >
            →
          </button>
          <button
            className={s.secondary}
            onClick={() => setMonth(todayDate().slice(0, 7))}
          >
            This month
          </button>
        </div>
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams & personal plans</option>
            <option value="personal">My personal plans</option>
            {current?.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All matches</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past fixtures</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </section>
      {error && (
        <div className={s.error} role="alert">
          <span>
            {error}
            {current ? " Showing the last loaded fixtures." : ""}
          </span>
          <button
            className={s.secondary}
            onClick={() => setRetry((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {loading && !current ? (
        <div className={s.loading} role="status">
          Loading your matches…
        </div>
      ) : (
        current && (
          <>
            <section className={m.hero} aria-label="Next match">
              <div>
                <p className={m.kicker}>NEXT UP · {monthLabel(month)}</p>
                <h2>{next?.title || "Your next match starts here."}</h2>
                {next ? (
                  <>
                    <p className={m.heroTeam}>{next.team_name}</p>
                    <p>
                      {dayLabel(next.date)} · {next.start_time}–{next.end_time}
                    </p>
                    <p>
                      {next.venue || "Venue to be confirmed"} · {next.timezone}
                    </p>
                  </>
                ) : (
                  <p>
                    No upcoming matches in this month for your selection. Browse
                    another month or check your team calendar.
                  </p>
                )}
              </div>
              <div className={m.summary}>
                <strong>{upcoming.length}</strong>
                <span>
                  upcoming {upcoming.length === 1 ? "match" : "matches"}
                  <br />
                  in this month
                </span>
              </div>
            </section>
            <div className={m.listHeading}>
              <h2>{monthLabel(month)}</h2>
              <span>
                {visible.length} {visible.length === 1 ? "fixture" : "fixtures"}
              </span>
            </div>
            {visible.length ? (
              <div className={m.list}>
                {visible.map((e) => (
                  <article
                    className={`${m.card} ${e.cancelled ? m.cancelled : ""}`}
                    key={e.id}
                  >
                    <div className={m.dateTile}>
                      <span>
                        {new Date(e.date + "T12:00:00Z").toLocaleDateString(
                          "en-ZA",
                          { month: "short", timeZone: "UTC" },
                        )}
                      </span>
                      <strong>{Number(e.date.slice(8))}</strong>
                    </div>
                    <div className={m.content}>
                      <div className={m.cardTop}>
                        <p className={m.team}>
                          {e.team_name}
                          {e.source === "personal" ? " · Private plan" : ""}
                        </p>
                        <span className={e.cancelled ? m.cancelBadge : m.badge}>
                          {label(e)}
                        </span>
                      </div>
                      <h3>{e.title}</h3>
                      <p className={m.details}>
                        {dayLabel(e.date)} · {e.start_time}–{e.end_time} (
                        {e.timezone})
                      </p>
                      <p className={m.venue}>
                        {e.venue || "Venue to be confirmed"}
                      </p>
                      {e.notes && (
                        <div className={m.notes}>
                          <strong>
                            {e.source === "personal"
                              ? "My notes"
                              : "Coach’s notes"}
                          </strong>
                          <p>{e.notes}</p>
                        </div>
                      )}
                      {e.cancelled && (
                        <p className={m.cancellation}>
                          This match has been cancelled.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={m.empty}>
                <h3>No matches to show</h3>
                <p>
                  {matches.length
                    ? "Try another status to see the rest of your fixtures."
                    : "Matches scheduled by your coach, and your own match plans, will appear here."}
                </p>
                <Link
                  className={s.secondary}
                  href="/dashboard/athlete/calendar"
                >
                  View my calendar
                </Link>
              </div>
            )}
            <p className={m.footnote}>
              Fixtures show scheduled matches. Past fixtures do not confirm
              participation or a result.
            </p>
          </>
        )
      )}
    </div>
  );
}
