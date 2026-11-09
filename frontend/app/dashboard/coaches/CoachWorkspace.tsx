"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  calendarDays,
  displayDate,
  monthBounds,
  planningRequest,
  recurrenceCount,
  SESSION_TYPES,
  shiftMonth,
  todayDate,
  WEEKDAYS,
  type Session,
  type Team,
} from "./planning";
import styles from "./workspace.module.css";

type Mode = "overview" | "teams" | "schedule";
const typeOf = (kind: string) =>
  SESSION_TYPES.find((t) => t.id === kind) || SESSION_TYPES[0];
const sessionStyle = (kind: string) =>
  ({
    "--session-color": typeOf(kind).color,
    "--session-soft": typeOf(kind).soft,
  }) as CSSProperties;

export function Modal({
  title,
  description,
  close,
  children,
}: {
  title: string;
  description: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.modal}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      aria-labelledby="planning-dialog-title"
      aria-describedby="planning-dialog-description"
    >
      <div className={styles.modalHeader}>
        <div>
          <p className={styles.eyebrow}>COACH WORKSPACE</p>
          <h2 id="planning-dialog-title">{title}</h2>
          <p id="planning-dialog-description" className={styles.muted}>
            {description}
          </p>
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Close dialog"
          onClick={close}
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function CoachWorkspace({ mode }: { mode: Mode }) {
  const [month, setMonth] = useState(() => todayDate().slice(0, 7));
  const [teams, setTeams] = useState<Team[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamFilter, setTeamFilter] = useState("all");
  const [view, setView] = useState<"month" | "agenda">("month");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [teamEditor, setTeamEditor] = useState<Team | "new" | null>(null);
  const [eventEditor, setEventEditor] = useState<{
    date: string;
    teamId: string;
    event?: Session;
  } | null>(null);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("Coach");
  const today = todayDate();

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.first_name) setName(user.first_name);
    } catch {}
    const selected = new URLSearchParams(window.location.search).get("team");
    if (selected) setTeamFilter(selected);
  }, []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    const { from, to } = monthBounds(month);
    Promise.all([
      planningRequest<Team[]>("/teams"),
      planningRequest<Session[]>(`/events?from=${from}&to=${to}`),
    ])
      .then(([nextTeams, nextSessions]) => {
        if (current) {
          setTeams(nextTeams);
          setSessions(nextSessions);
        }
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [month, reload]);

  const visible = sessions.filter(
    (s) => teamFilter === "all" || s.team_id === teamFilter,
  );
  const upcoming = sessions.filter((s) => s.date >= today).slice(0, 5);
  const hours =
    visible.reduce(
      (total, s) =>
        total +
        (Number(s.end_time.slice(0, 2)) * 60 + Number(s.end_time.slice(3))) -
        (Number(s.start_time.slice(0, 2)) * 60 + Number(s.start_time.slice(3))),
      0,
    ) / 60;
  const addSession = (
    date = month === today.slice(0, 7) ? today : `${month}-01`,
    teamId = teamFilter !== "all" ? teamFilter : teams[0]?.id,
  ) => {
    if (!teams.length) {
      setTeamEditor("new");
      return;
    }
    setEventEditor({
      date,
      teamId: teams.some((t) => t.id === teamId) ? teamId : teams[0].id,
    });
  };
  const saved = (message: string) => {
    setNotice(message);
    setReload((r) => r + 1);
  };
  const title =
    mode === "overview"
      ? `Your next great month, ${name}.`
      : mode === "teams"
        ? "Build your team."
        : "Make every session count.";

  function eventButton(session: Session, compact = false) {
    return (
      <button
        key={session.id}
        type="button"
        className={compact ? styles.calendarEvent : styles.agendaEvent}
        style={sessionStyle(session.kind)}
        onClick={() =>
          setEventEditor({
            date: session.date,
            teamId: session.team_id,
            event: session,
          })
        }
      >
        {compact ? (
          <>
            <span className={styles.eventTime}>{session.start_time}</span>
            <span>{session.title}</span>
            {teamFilter === "all" && <small>{session.team_name}</small>}
          </>
        ) : (
          <>
            <span className={styles.typeMark}>{typeOf(session.kind).mark}</span>
            <span className={styles.eventBody}>
              <strong>{session.title}</strong>
              <small>
                {session.team_name} · {session.venue || "Venue not set"}
              </small>
            </span>
            <span className={styles.agendaTime}>
              {session.start_time}–{session.end_time}
              <small>{typeOf(session.kind).label}</small>
            </span>
            <span aria-hidden="true">↗</span>
          </>
        )}
      </button>
    );
  }
  function agenda(items: Session[]) {
    const dates = [...new Set(items.map((s) => s.date))];
    return (
      <div className={styles.agenda}>
        {dates.map((date) => (
          <section key={date} className={styles.agendaDay}>
            <div className={styles.agendaDate}>
              <strong>{Number(date.slice(-2))}</strong>
              <span>
                {displayDate(date, { weekday: "short", month: "short" })}
              </span>
            </div>
            <div className={styles.agendaEvents}>
              {items.filter((s) => s.date === date).map((s) => eventButton(s))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.topline}>
        <span>YOUR COACHING SPACE</span>
        <span className={styles.sportTag}>
          ◉ Rugby <span> / </span> South Africa
        </span>
      </div>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>
            {mode === "overview"
              ? "THE GAME STARTS HERE"
              : mode === "teams"
                ? "YOUR SQUADS"
                : "TEAM SCHEDULE"}
          </p>
          <h1>{title}</h1>
          <p className={styles.subtitle}>
            {mode === "teams"
              ? "A home for each squad. A clear plan for every player."
              : mode === "schedule"
                ? "Practices, match days and everything in between. All in one place."
                : "Bring your teams together. Give the month a clear plan."}
          </p>
        </div>
        <button
          className={styles.primary}
          disabled={loading || !!error}
          onClick={() =>
            mode === "teams" || !teams.length
              ? setTeamEditor("new")
              : addSession()
          }
        >
          <span aria-hidden="true">＋</span>{" "}
          {mode === "teams" || !teams.length ? "Create team" : "Add session"}
        </button>
      </header>
      {notice && (
        <div role="status" className={styles.notice}>
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
        <div role="alert" className={styles.error}>
          {error}
          <button
            className={styles.secondary}
            onClick={() => setReload((r) => r + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {loading ? (
        <div role="status" className={styles.loading}>
          <span className={styles.loadingDot} /> Loading your coaching space…
        </div>
      ) : (
        !error && (
          <>
            {mode === "overview" && (
              <>
                <div className={styles.overviewGrid}>
                  <section className={styles.playbook}>
                    <div>
                      <span className={styles.lightEyebrow}>
                        A LITTLE STRUCTURE. A STRONGER TEAM.
                      </span>
                      <h2>
                        Good rugby starts
                        <br />
                        with a good plan.
                      </h2>
                      <p>
                        Create your squad, set your weekly rhythm, and give
                        every session a purpose.
                      </p>
                      <Link
                        className={styles.yellowButton}
                        href={
                          teams.length
                            ? "/dashboard/coaches/schedule"
                            : "/dashboard/coaches/teams"
                        }
                      >
                        {teams.length
                          ? "Plan this month"
                          : "Create your first team"}{" "}
                        <span>↗</span>
                      </Link>
                    </div>
                    <div className={styles.pitch} aria-hidden="true">
                      <div className={styles.pitchLine} />
                      <div className={styles.pitchCircle} />
                      <span className={styles.playerOne}>10</span>
                      <span className={styles.playerTwo}>9</span>
                      <span className={styles.playerThree}>15</span>
                      <div className={styles.pitchArrow}>↗</div>
                    </div>
                  </section>
                  <section className={styles.monthSnapshot}>
                    <p className={styles.eyebrow}>
                      {displayDate(`${month}-01`, {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h2>The month at a glance</h2>
                    <div>
                      <strong>{teams.length}</strong>
                      <span>
                        {teams.length === 1 ? "team" : "teams"} in your
                        workspace
                      </span>
                    </div>
                    <div>
                      <strong>{sessions.length}</strong>
                      <span>sessions on the calendar</span>
                    </div>
                    <div>
                      <strong>
                        {sessions.filter((s) => s.kind === "match").length}
                      </strong>
                      <span>match days planned</span>
                    </div>
                  </section>
                </div>
                <div className={styles.sectionHeading}>
                  <div>
                    <p className={styles.eyebrow}>KEEP THE MOMENTUM</p>
                    <h2>Coming up this month</h2>
                  </div>
                  <Link href="/dashboard/coaches/schedule">
                    View schedule ↗
                  </Link>
                </div>
                {upcoming.length ? (
                  agenda(upcoming)
                ) : (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>↗</span>
                    <h3>Your next session starts here.</h3>
                    <p>
                      {teams.length
                        ? "Add a session or repeat a weekly routine to fill your month."
                        : "Create a team first. Then build a schedule around your squad."}
                    </p>
                    <button
                      className={styles.primary}
                      onClick={() => addSession()}
                    >
                      {teams.length ? "Plan a session" : "Create a team"}
                    </button>
                  </div>
                )}
              </>
            )}
            {mode === "teams" && (
              <>
                <div className={styles.sectionHeading}>
                  <span className={styles.count}>
                    {teams.length} {teams.length === 1 ? "team" : "teams"}
                  </span>
                  <input
                    className={styles.search}
                    aria-label="Search teams"
                    placeholder="Search your teams…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                {!teams.length ? (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>◉</span>
                    <h2>Every great season starts with a team.</h2>
                    <p>
                      Give your squad a name, choose an age group, and you’re
                      ready to plan.
                    </p>
                    <button
                      className={styles.primary}
                      onClick={() => setTeamEditor("new")}
                    >
                      Create your first team
                    </button>
                  </div>
                ) : (
                  <div className={styles.teamGrid}>
                    {teams
                      .filter((t) =>
                        `${t.name} ${t.age_group}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((team, index) => {
                        const planned = sessions.filter(
                          (s) => s.team_id === team.id,
                        );
                        return (
                          <article className={styles.teamCard} key={team.id}>
                            <div className={styles.teamCardTop}>
                              <span
                                className={styles.teamBadge}
                                style={{
                                  background: ["#eaf3e9", "#edf1fa", "#fff3df"][
                                    index % 3
                                  ],
                                }}
                              >
                                {team.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </span>
                              <button
                                className={styles.textButton}
                                onClick={() => setTeamEditor(team)}
                                aria-label={`Edit ${team.name}`}
                              >
                                Edit ↗
                              </button>
                            </div>
                            <span className={styles.teamSport}>
                              RUGBY · {team.age_group}
                            </span>
                            <h2>{team.name}</h2>
                            <p className={styles.teamVenue}>
                              ⌖ {team.venue || "Add a home venue"}
                            </p>
                            <div className={styles.teamStats}>
                              <strong>{team.player_count ?? 0}</strong>
                              <span>active players ·</span>
                              <strong>{planned.length}</strong>
                              <span>
                                sessions in{" "}
                                {displayDate(`${month}-01`, { month: "long" })}
                              </span>
                            </div>
                            <Link
                              className={styles.primary}
                              href={`/dashboard/coaches/teams/${team.id}`}
                            >
                              Manage players →
                            </Link>
                            <Link
                              className={styles.teamLink}
                              href={`/dashboard/coaches/schedule?team=${team.id}`}
                            >
                              Open team schedule <span>→</span>
                            </Link>
                          </article>
                        );
                      })}
                    <button
                      className={styles.newTeamCard}
                      onClick={() => setTeamEditor("new")}
                    >
                      <span>＋</span>Create another team
                    </button>
                  </div>
                )}
                {teams.length > 0 &&
                  query &&
                  !teams.some((t) =>
                    `${t.name} ${t.age_group}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <p className={styles.muted}>No teams match “{query}”.</p>
                  )}
              </>
            )}
            {mode === "schedule" && (
              <>
                {!teams.length ? (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon}>▦</span>
                    <h2>First, give your schedule a team.</h2>
                    <p>
                      Create a rugby squad, then add practices, gym sessions and
                      match days.
                    </p>
                    <button
                      className={styles.primary}
                      onClick={() => setTeamEditor("new")}
                    >
                      Create team
                    </button>
                  </div>
                ) : (
                  <>
                    <section
                      className={styles.teamFilterBar}
                      aria-label="Team schedule filter"
                    >
                      <label htmlFor="schedule-team">Show schedule for</label>
                      <select
                        id="schedule-team"
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                      >
                        <option value="all">All teams</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name} · {team.age_group}
                          </option>
                        ))}
                      </select>
                      <p role="status">
                        {teamFilter === "all"
                          ? "Showing sessions for all your teams."
                          : `Showing only ${teams.find((t) => t.id === teamFilter)?.name || "this team"}’s sessions.`}
                      </p>
                    </section>
                    <div className={styles.toolbar}>
                      <div className={styles.monthControls}>
                        <button
                          aria-label="Previous month"
                          onClick={() => setMonth(shiftMonth(month, -1))}
                        >
                          ‹
                        </button>
                        <h2>
                          {displayDate(`${month}-01`, {
                            month: "long",
                            year: "numeric",
                          })}
                        </h2>
                        <button
                          aria-label="Next month"
                          onClick={() => setMonth(shiftMonth(month, 1))}
                        >
                          ›
                        </button>
                        <button
                          className={styles.today}
                          onClick={() => setMonth(today.slice(0, 7))}
                        >
                          Today
                        </button>
                      </div>
                      <div className={styles.viewControls}>
                        <div className={styles.viewSwitch}>
                          <button
                            aria-pressed={view === "month"}
                            onClick={() => setView("month")}
                          >
                            Month
                          </button>
                          <button
                            aria-pressed={view === "agenda"}
                            onClick={() => setView("agenda")}
                          >
                            Agenda
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className={styles.scheduleSummary}>
                      <span>
                        <strong>{visible.length}</strong> sessions <b>·</b>{" "}
                        <strong>{Number(hours.toFixed(1))}</strong> planned
                        hours
                      </span>
                      <span>All times SAST (UTC+2)</span>
                    </div>
                    <div className={styles.legend}>
                      {SESSION_TYPES.map((t) => (
                        <span key={t.id}>
                          <i style={{ background: t.color }} />
                          {t.label}
                        </span>
                      ))}
                    </div>
                    {view === "month" && (
                      <div className={styles.monthView}>
                        <div className={styles.weekdays}>
                          {WEEKDAYS.map((d) => (
                            <span key={d.day}>{d.label}</span>
                          ))}
                        </div>
                        <div className={styles.calendar}>
                          {calendarDays(month).map((date, index) => (
                            <div
                              key={date || `blank-${index}`}
                              className={`${styles.day} ${!date ? styles.blank : ""} ${date === today ? styles.todayCell : ""}`}
                            >
                              {date && (
                                <>
                                  <button
                                    className={styles.dayNumber}
                                    onClick={() => addSession(date)}
                                    aria-label={`Add session on ${displayDate(date)}`}
                                  >
                                    <span>{Number(date.slice(-2))}</span>
                                    <span className={styles.dayPlus}>＋</span>
                                  </button>
                                  <div className={styles.dayEvents}>
                                    {visible
                                      .filter((s) => s.date === date)
                                      .map((s) => eventButton(s, true))}
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className={styles.calendarHint}>
                          Select a date to add a session. Select a session to
                          edit it.
                        </p>
                      </div>
                    )}
                    <div
                      className={view === "month" ? styles.mobileAgenda : ""}
                    >
                      {visible.length ? (
                        agenda(visible)
                      ) : (
                        <div className={styles.empty}>
                          <h3>A fresh month. Room to build.</h3>
                          <p>
                            Start with a practice session, then repeat it on
                            your training days.
                          </p>
                          <button
                            className={styles.primary}
                            onClick={() => addSession()}
                          >
                            Add first session
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )
      )}
      {teamEditor && (
        <TeamEditor
          team={teamEditor === "new" ? undefined : teamEditor}
          close={() => setTeamEditor(null)}
          onSaved={(team) => {
            setTeamEditor(null);
            setTeamFilter(team.id);
            saved(`${team.name} saved. Your team is ready to plan.`);
          }}
        />
      )}
      {eventEditor && (
        <SessionEditor
          initial={eventEditor}
          teams={teams}
          close={() => setEventEditor(null)}
          onSaved={(message) => {
            setEventEditor(null);
            saved(message);
          }}
        />
      )}
    </div>
  );
}

function TeamEditor({
  team,
  close,
  onSaved,
}: {
  team?: Team;
  close: () => void;
  onSaved: (team: Team) => void;
}) {
  const [name, setName] = useState(team?.name || "");
  const [age, setAge] = useState(team?.age_group || "U18");
  const [venue, setVenue] = useState(team?.venue || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      onSaved(
        await planningRequest<Team>(team ? `/teams/${team.id}` : "/teams", {
          method: team ? "PATCH" : "POST",
          body: JSON.stringify({ name, age_group: age, venue }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={team ? "Edit your team" : "Meet your next team."}
      description="Just the essentials. You can change these details later."
      close={() => !busy && close()}
    >
      <form onSubmit={submit} className={styles.form}>
        <label>
          Team name
          <input
            autoFocus
            required
            maxLength={100}
            placeholder="e.g. Stellenbosch U18 A"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className={styles.formRow}>
          <label>
            Sport
            <input value="Rugby" readOnly />
          </label>
          <label>
            Age group
            <select value={age} onChange={(e) => setAge(e.target.value)}>
              {[
                "U7",
                "U8",
                "U9",
                "U10",
                "U11",
                "U12",
                "U13",
                "U14",
                "U15",
                "U16",
                "U17",
                "U18",
                "U19",
                "U20",
                "U21",
                "Senior",
                "Open",
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Home venue <span className={styles.optional}>optional</span>
          <input
            maxLength={160}
            placeholder="e.g. Main rugby field"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />
        </label>
        <div className={styles.formTip}>
          Your team and schedule are saved to your coach account. Scheduling
          uses South African Standard Time.
        </div>
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}
        <footer className={styles.formFooter}>
          <button
            type="button"
            className={styles.secondary}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={styles.primary} disabled={busy}>
            {busy ? "Saving…" : team ? "Save changes" : "Create team"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function SessionEditor({
  initial,
  teams,
  close,
  onSaved,
}: {
  initial: { date: string; teamId: string; event?: Session };
  teams: Team[];
  close: () => void;
  onSaved: (message: string) => void;
}) {
  const event = initial.event;
  const [form, setForm] = useState({
    team_id: initial.teamId,
    title: event?.title || "Rugby practice",
    kind: event?.kind || "practice",
    date: initial.date,
    start_time: event?.start_time || "16:00",
    end_time: event?.end_time || "17:30",
    venue:
      event?.venue ?? teams.find((t) => t.id === initial.teamId)?.venue ?? "",
    notes: event?.notes || "",
  });
  const [repeat, setRepeat] = useState(false);
  const [weekdays, setWeekdays] = useState([
    new Date(`${initial.date}T12:00:00Z`).getUTCDay(),
  ]);
  const [until, setUntil] = useState(monthBounds(initial.date.slice(0, 7)).to);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const count = repeat ? recurrenceCount(form.date, until, weekdays) : 1;
  const change = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));
  function chooseType(kind: string) {
    const type = typeOf(kind);
    const start =
      Number(form.start_time.slice(0, 2)) * 60 +
      Number(form.start_time.slice(3));
    const end = Math.min(start + type.duration, 1439);
    setForm((f) => ({
      ...f,
      kind,
      title: type.title,
      end_time: `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`,
    }));
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (form.end_time <= form.start_time) {
      setError("Choose an end time after the start time.");
      return;
    }
    if (
      repeat &&
      (!count || Date.parse(until) - Date.parse(form.date) > 92 * 86400000)
    ) {
      setError("Choose repeat days and an end date within 92 days.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await planningRequest<{ count: number }>(
        `/teams/${form.team_id}/events${event ? `/${event.id}` : ""}`,
        {
          method: event ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            ...(repeat && !event ? { repeat: { until, weekdays } } : {}),
          }),
        },
      );
      onSaved(
        event
          ? "Session updated."
          : `${result.count} ${result.count === 1 ? "session added" : "sessions added"} to your schedule.`,
      );
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  async function remove() {
    if (!event || busy) return;
    setBusy(true);
    setError("");
    try {
      await planningRequest(`/teams/${event.team_id}/events/${event.id}`, {
        method: "DELETE",
      });
      onSaved("Session removed.");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={event ? "Fine-tune your session." : "Put the plan in motion."}
      description={
        event
          ? "Changes apply to this session only."
          : "Choose a session type, then make it your own."
      }
      close={() => !busy && close()}
    >
      <form className={styles.form} onSubmit={submit}>
        <fieldset className={styles.typePicker}>
          <legend>Session type</legend>
          {SESSION_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={form.kind === t.id}
              style={sessionStyle(t.id)}
              onClick={() => chooseType(t.id)}
            >
              <span>{t.mark}</span>
              {t.label}
            </button>
          ))}
        </fieldset>
        <label>
          Session title
          <input
            autoFocus
            required
            maxLength={120}
            value={form.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </label>
        <div className={styles.formRow}>
          <label>
            Team
            <select
              required
              value={form.team_id}
              disabled={!!event}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  team_id: e.target.value,
                  venue:
                    teams.find((t) => t.id === e.target.value)?.venue || "",
                }))
              }
            >
              {teams.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {repeat ? "Start date" : "Date"}
            <input
              type="date"
              required
              min="2000-01-01"
              max="2100-12-31"
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
            />
          </label>
        </div>
        <div className={styles.formRow}>
          <label>
            Start time
            <input
              type="time"
              required
              value={form.start_time}
              onChange={(e) => change("start_time", e.target.value)}
            />
          </label>
          <label>
            End time
            <input
              type="time"
              required
              value={form.end_time}
              onChange={(e) => change("end_time", e.target.value)}
            />
          </label>
        </div>
        <p className={styles.timezone}>SAST · South Africa (UTC+2)</p>
        {!event && (
          <div className={styles.repeatBox}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
              />
              <span>
                <strong>Repeat weekly</strong>
                <small>Build your training rhythm for the month.</small>
              </span>
            </label>
            {repeat && (
              <>
                <div className={styles.repeatDays}>
                  {WEEKDAYS.map((d) => (
                    <button
                      type="button"
                      key={d.day}
                      aria-pressed={weekdays.includes(d.day)}
                      onClick={() =>
                        setWeekdays((days) =>
                          days.includes(d.day)
                            ? days.filter((day) => day !== d.day)
                            : [...days, d.day],
                        )
                      }
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <label>
                  Repeat until
                  <input
                    type="date"
                    required
                    min={form.date}
                    max="2100-12-31"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </label>
                <p className={styles.repeatPreview}>
                  {count} {count === 1 ? "session" : "sessions"} will be
                  created. Each can be edited separately.
                </p>
              </>
            )}
          </div>
        )}
        <label>
          {form.kind === "match" ? "Match venue" : "Venue"}{" "}
          <span className={styles.optional}>optional</span>
          <input
            maxLength={160}
            placeholder="Where is the team meeting?"
            value={form.venue}
            onChange={(e) => change("venue", e.target.value)}
          />
        </label>
        <label>
          {form.kind === "match"
            ? "Opponent & match notes"
            : "Session focus & notes"}{" "}
          <span className={styles.optional}>optional</span>
          <textarea
            maxLength={2000}
            rows={3}
            placeholder={
              form.kind === "practice"
                ? "e.g. Defensive shape, lineouts, then a conditioned game."
                : "What should the team focus on?"
            }
            value={form.notes}
            onChange={(e) => change("notes", e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}
        {deleting && (
          <div className={styles.deleteConfirm}>
            <p>
              Remove “{event?.title}” on {displayDate(form.date)}? Other
              sessions in the series will stay.
            </p>
            <button
              type="button"
              className={styles.danger}
              disabled={busy}
              onClick={remove}
            >
              {busy ? "Removing…" : "Yes, remove session"}
            </button>
            <button
              type="button"
              className={styles.textButton}
              disabled={busy}
              onClick={() => setDeleting(false)}
            >
              Keep session
            </button>
          </div>
        )}
        <footer className={styles.formFooter}>
          {event && (
            <button
              type="button"
              className={styles.deleteButton}
              disabled={busy}
              onClick={() => setDeleting(true)}
            >
              Remove session
            </button>
          )}
          <button
            type="button"
            className={styles.secondary}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={styles.primary} disabled={busy || deleting}>
            {busy
              ? "Saving…"
              : event
                ? "Save changes"
                : `Add ${count > 1 ? `${count} sessions` : "session"}`}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
