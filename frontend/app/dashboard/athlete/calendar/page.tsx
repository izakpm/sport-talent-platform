"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hub, type HubTeam } from "../../team-hub/api";
import { Modal } from "../../coaches/CoachWorkspace";
import { todayDate, shiftMonth } from "../../coaches/planning";
import {
  KINDS,
  monthDays,
  monthLabel,
  dayLabel,
  filterEvents,
  type CalendarEvent,
} from "./calendar";
import s from "../../coaches/workspace.module.css";
import c from "./calendar.module.css";
export default function AthleteCalendar() {
  const [month, setMonth] = useState(() => todayDate().slice(0, 7)),
    [day, setDay] = useState(() => todayDate()),
    [view, setView] = useState("month"),
    [team, setTeam] = useState(""),
    [kind, setKind] = useState(""),
    [upcoming, setUpcoming] = useState(false),
    [cancelled, setCancelled] = useState(true),
    [data, setData] = useState<{
      month: string;
      events: CalendarEvent[];
      teams: HubTeam[];
    } | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState<CalendarEvent | null>(null),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setSelected(null);
    const refresh = async () => {
      try {
        const [events, teams] = await Promise.all([
          hub<CalendarEvent[]>("/calendar?month=" + month),
          hub<HubTeam[]>("/teams"),
        ]);
        if (active) {
          setData({ month, events, teams });
          setTeam((previous) =>
            !previous || teams.some((t) => t.id === previous) ? previous : "",
          );
          setError("");
          setNow(Date.now());
          setSelected((previous) =>
            previous ? events.find((e) => e.id === previous.id) || null : null,
          );
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [month, retry]);
  const current = data?.month === month ? data : null;
  const events = filterEvents(
    current?.events || [],
    team,
    kind,
    upcoming,
    cancelled,
    now,
  );
  const activeEvents = events.filter((e) => !e.cancelled);
  const next = activeEvents.find((e) => Date.parse(e.ends_at) >= now);
  const chosen = events.filter((e) => e.date === day);
  const dates = [...new Set(events.map((e) => e.date))];
  const today = todayDate();
  function changeMonth(value: string) {
    if (!/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(value)) return;
    setMonth(value);
    setDay(value === today.slice(0, 7) ? today : value + "-01");
  }
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={c.eyebrow}>MY TEAM CALENDAR</p>
          <h1>Know what’s next.</h1>
          <p className={s.subtitle}>
            Your team sessions and match days, straight from your coach’s
            schedule.
          </p>
        </div>
        <Link className={s.secondary} href="/dashboard/athlete/attendance">
          My attendance ↗
        </Link>
      </header>
      <section className={c.banner}>
        <div>
          <p className={c.eyebrow}>
            NEXT UP · {monthLabel(month).toUpperCase()}
          </p>
          {!current ? (
            <h2>{error ? "Schedule unavailable" : "Loading your schedule…"}</h2>
          ) : next ? (
            <>
              <h2>{next.title}</h2>
              <p>
                {next.team_name} · {dayLabel(next.date)} · {next.start_time}–
                {next.end_time}
              </p>
              <p>
                {next.venue || "Venue to be confirmed"} ·{" "}
                {next.timezone === "Africa/Johannesburg"
                  ? "SAST"
                  : next.timezone}
              </p>
            </>
          ) : (
            <>
              <h2>No upcoming sessions in this view.</h2>
              <p>Browse another month or change your filters.</p>
            </>
          )}
        </div>
        {next && (
          <button className={s.primary} onClick={() => setSelected(next)}>
            View details ↗
          </button>
        )}
      </section>
      <div className={c.toolbar}>
        <div className={c.monthControl}>
          <button
            className={s.secondary}
            aria-label="Previous month"
            disabled={month === "1900-01"}
            onClick={() => changeMonth(shiftMonth(month, -1))}
          >
            ←
          </button>
          <label className={c.monthInput}>
            <span className={c.srOnly}>Choose month</span>
            <input
              type="month"
              value={month}
              min="1900-01"
              max="2099-12"
              onChange={(e) => changeMonth(e.target.value)}
            />
          </label>
          <button
            className={s.secondary}
            aria-label="Next month"
            disabled={month === "2099-12"}
            onClick={() => changeMonth(shiftMonth(month, 1))}
          >
            →
          </button>
          <button
            className={s.textButton}
            onClick={() => {
              changeMonth(today.slice(0, 7));
              setDay(today);
            }}
          >
            Today
          </button>
        </div>
        <div className={c.views} aria-label="Calendar view">
          <button
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </button>
          <button
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List
          </button>
        </div>
      </div>
      <div className={c.filters}>
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All my teams</option>
            {data?.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Session type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All sessions & matches</option>
            {Object.entries(KINDS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={c.check}>
          <input
            type="checkbox"
            checked={upcoming}
            onChange={(e) => setUpcoming(e.target.checked)}
          />
          Upcoming only
        </label>
        <label className={c.check}>
          <input
            type="checkbox"
            checked={cancelled}
            onChange={(e) => setCancelled(e.target.checked)}
          />
          Show cancelled
        </label>
      </div>
      {error && (
        <p role="alert" className={s.error}>
          {error} {current && "Showing your last loaded schedule."}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {loading ? (
        <p role="status" className={s.loading}>
          Loading {monthLabel(month)}…
        </p>
      ) : (
        current && (
          <>
            {!current.teams.length ? (
              <section className={s.empty}>
                <h2>Your team schedule starts here.</h2>
                <p>
                  Ask your coach to add you to their roster and link your
                  registered email. Their sessions and matches will then appear
                  automatically.
                </p>
                <Link className={s.secondary} href="/dashboard/profile">
                  Check my profile ↗
                </Link>
              </section>
            ) : (
              <>
                <div className={c.counts}>
                  <h2>{monthLabel(month)}</h2>
                  <span>
                    {activeEvents.length} scheduled ·{" "}
                    {activeEvents.filter((e) => e.kind === "match").length}{" "}
                    matches
                    {events.some((e) => e.cancelled)
                      ? ` · ${events.filter((e) => e.cancelled).length} cancelled`
                      : ""}
                  </span>
                </div>
                {view === "month" ? (
                  <>
                    <div
                      className={c.calendar}
                      aria-label={`${monthLabel(month)} calendar`}
                    >
                      <div className={c.weekdays} aria-hidden="true">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (d) => (
                            <span key={d}>{d}</span>
                          ),
                        )}
                      </div>
                      <div className={c.grid}>
                        {monthDays(month).map((date, i) => {
                          if (!date)
                            return (
                              <div key={"blank" + i} className={c.blank} />
                            );
                          const rows = events.filter((e) => e.date === date);
                          return (
                            <section
                              className={`${c.day} ${date === day ? c.selected : ""} ${date < today ? c.past : ""} ${rows.some((e) => e.kind === "match" && !e.cancelled) ? c.matchDay : ""}`}
                              key={date}
                            >
                              <button
                                className={`${c.dayButton} ${date === today ? c.today : ""}`}
                                aria-label={`${dayLabel(date)}, ${rows.length} ${rows.length === 1 ? "event" : "events"}`}
                                aria-pressed={date === day}
                                onClick={() => setDay(date)}
                              >
                                {Number(date.slice(-2))}
                                <span className={c.mobileCount}>
                                  {rows.length > 0
                                    ? `${rows.length} ${rows.some((e) => e.kind === "match") ? "· M" : ""}`
                                    : ""}
                                </span>
                              </button>
                              <div className={c.dayEvents}>
                                {rows.slice(0, 2).map((e) => (
                                  <button
                                    key={e.id}
                                    className={`${c.event} ${e.kind === "match" ? c.match : ""} ${e.cancelled ? c.cancelled : ""}`}
                                    onClick={() => setSelected(e)}
                                    title={`${e.title} · ${e.team_name}`}
                                  >
                                    <strong>
                                      {e.cancelled ? "Cancelled" : e.start_time}{" "}
                                      · {KINDS[e.kind] || "Session"}
                                    </strong>
                                    <span>{e.title}</span>
                                    <small>{e.team_name}</small>
                                  </button>
                                ))}
                                {rows.length > 2 && (
                                  <button
                                    className={c.more}
                                    onClick={() => setDay(date)}
                                  >
                                    +{rows.length - 2} more
                                  </button>
                                )}
                              </div>
                            </section>
                          );
                        })}
                      </div>
                    </div>
                    <p className={c.hint}>
                      Select a day to see all its sessions. Match days are
                      highlighted in yellow. Times are shown in each team’s
                      timezone.
                    </p>
                    <section
                      className={c.dayPanel}
                      aria-label="Selected day sessions"
                    >
                      <h2>{dayLabel(day)}</h2>
                      {chosen.length ? (
                        chosen.map((e) => (
                          <EventCard
                            key={e.id}
                            event={e}
                            open={() => setSelected(e)}
                          />
                        ))
                      ) : (
                        <p className={c.empty}>
                          No sessions match this day and your filters.
                        </p>
                      )}
                    </section>
                  </>
                ) : (
                  <div className={c.agenda}>
                    {dates.length ? (
                      dates.map((date) => (
                        <section key={date}>
                          <h3 className={c.dateHeading}>{dayLabel(date)}</h3>
                          {events
                            .filter((e) => e.date === date)
                            .map((e) => (
                              <EventCard
                                key={e.id}
                                event={e}
                                open={() => setSelected(e)}
                              />
                            ))}
                        </section>
                      ))
                    ) : (
                      <section className={s.empty}>
                        <h2>No sessions in this view.</h2>
                        <p>
                          Try another month or change your team and session
                          filters.
                        </p>
                      </section>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )
      )}
      {selected && (
        <Modal
          title={selected.title}
          description={`${selected.team_name} · ${KINDS[selected.kind] || "Team session"}`}
          close={() => setSelected(null)}
        >
          <div className={s.form}>
            {selected.cancelled && (
              <p role="status" className={c.cancellation}>
                Cancelled — this session is not taking place. Check the team
                feed for your coach’s update.
              </p>
            )}
            <dl className={c.details}>
              <div>
                <dt>Date</dt>
                <dd>{dayLabel(selected.date)}</dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  {selected.start_time}–{selected.end_time} ·{" "}
                  {selected.timezone === "Africa/Johannesburg"
                    ? "SAST"
                    : selected.timezone}
                </dd>
              </div>
              <div>
                <dt>Venue</dt>
                <dd>{selected.venue || "To be confirmed by your coach"}</dd>
              </div>
            </dl>
            <div>
              <h3>Coach’s notes</h3>
              <p className={c.notes}>
                {selected.notes || "No extra instructions yet."}
              </p>
            </div>
            <div className={s.formFooter}>
              <button className={s.secondary} onClick={() => setSelected(null)}>
                Close
              </button>
              <Link className={s.primary} href="/dashboard/athlete/feed">
                Open team feed ↗
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
function EventCard({
  event: e,
  open,
}: {
  event: CalendarEvent;
  open: () => void;
}) {
  return (
    <button
      className={`${c.eventCard} ${e.kind === "match" ? c.matchCard : ""}`}
      onClick={open}
    >
      <span className={c.time}>
        {e.start_time}
        <small>{e.end_time}</small>
      </span>
      <span className={c.cardBody}>
        <span className={c.tag}>
          {e.cancelled ? "CANCELLED" : KINDS[e.kind] || "Session"}
        </span>
        <strong className={e.cancelled ? c.strike : ""}>{e.title}</strong>
        <small>
          {e.team_name} · {e.venue || "Venue to be confirmed"} ·{" "}
          {e.timezone === "Africa/Johannesburg" ? "SAST" : e.timezone}
        </small>
      </span>
      <span aria-hidden="true">↗</span>
    </button>
  );
}
