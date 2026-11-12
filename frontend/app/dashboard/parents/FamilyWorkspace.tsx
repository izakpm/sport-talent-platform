"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  ProfileEditor,
  type Editor,
  type Profile,
} from "../profile/AthleteProfile";
import {
  PersonalEditor,
  CancelPersonal,
} from "../athlete/calendar/PersonalEditor";
import { family } from "./family-api";
import { selectChild, type GuardianChild } from "../../lib/guardian-context";
import {
  loadChild,
  childWrite,
  mergeShared,
  type ChildData,
  type Section,
} from "./family-data";
import { todayDate, shiftMonth } from "../coaches/planning";
import {
  monthDays,
  monthLabel,
  dayLabel,
  KINDS,
  type CalendarEvent,
} from "../athlete/calendar/calendar";
import { attendanceLabel } from "../team-hub/api";
import { ParentTraining } from "./ParentTraining";
import { outcome } from "../matches/MatchesWorkspace";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";
const titles: Record<Section, [string, string]> = {
  overview: [
    "Your family's sporting week",
    "Their progress. Your support. Everything together.",
  ],
  profile: [
    "Sporting profiles",
    "Their positions, achievements and progress, side by side.",
  ],
  activities: [
    "Activities",
    "Training logs and attendance for the children you manage.",
  ],
  calendar: [
    "Family calendar",
    "One calendar for training, match days and personal sessions.",
  ],
  matches: [
    "Matches",
    "Upcoming fixtures, results and each child's contribution.",
  ],
  feed: [
    "Team Feed",
    "Announcements and changes of plan from your children's coaches.",
  ],
  connections: [
    "Connections",
    "The coaches and teammates of the children you manage.",
  ],
};
const fullName = (c: GuardianChild) => [c.first_name, c.last_name].join(" ");
function editChild(child: GuardianChild, path: string) {
  selectChild(child);
  window.location.assign(path);
}
export function ChildBadges({ children: rows }: { children: GuardianChild[] }) {
  return (
    <div className={p.badges}>
      {rows.map((c) => (
        <span key={c.id} className={p.childBadge}>
          {fullName(c)}
        </span>
      ))}
    </div>
  );
}
export default function FamilyWorkspace({ section }: { section: Section }) {
  return (
    <Suspense fallback={<p>Loading family workspace…</p>}>
      <FamilyContent section={section} />
    </Suspense>
  );
}
export function FamilyContent({ section }: { section: Section }) {
  const params = useSearchParams();
  const [profileEditor, setProfileEditor] = useState<{
    child: GuardianChild;
    profile: Profile;
    editor: Editor;
  } | null>(null);
  const [sessionEditor, setSessionEditor] = useState<{
    child: GuardianChild;
    event: CalendarEvent | null;
    events: CalendarEvent[];
  } | null>(null);
  const [cancelSession, setCancelSession] = useState<{
    child: GuardianChild;
    event: CalendarEvent;
  } | null>(null);
  const [notice, setNotice] = useState("");
  function openProfile(row: ChildData, editor: Editor) {
    if (row.child.mode === "managed" && row.profile) {
      setNotice("");
      setProfileEditor({ child: row.child, profile: row.profile, editor });
    }
  }
  function openSession(
    child: GuardianChild,
    event: CalendarEvent | null = null,
  ) {
    if (child.mode !== "managed") return;
    setNotice("");
    setEvent(null);
    setSessionEditor({
      child,
      event,
      events: rows.find((r) => r.child.id === child.id)?.calendar || [],
    });
  }
  function sessionSaved(child: GuardianChild, session: CalendarEvent) {
    setSessionEditor(null);
    setCancelSession(null);
    setEvent(null);
    setMonth(session.date.slice(0, 7));
    setRetry((v) => v + 1);
    setNotice(
      `${fullName(child)}: ${session.cancelled ? "personal session cancelled" : "personal session saved"}.`,
    );
  }

  const [children, setChildren] = useState<GuardianChild[]>([]),
    [rows, setRows] = useState<ChildData[]>([]),
    [filter, setFilter] = useState(""),
    [ready, setReady] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  const [month, setMonth] = useState(() => todayDate().slice(0, 7)),
    [tab, setTab] = useState("details"),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState(""),
    [showCancelled, setShowCancelled] = useState(true);
  const [event, setEvent] = useState<
    ReturnType<typeof mergeShared<CalendarEvent>>[number] | null
  >(null);
  useEffect(() => {
    const parent = JSON.parse(localStorage.getItem("user") || "{}");
    setFilter(
      params.get("child") ??
        sessionStorage.getItem("family-filter:" + parent.id) ??
        "",
    );
    setReady(true);
  }, [params]);
  function choose(value: string) {
    setFilter(value);
    const parent = JSON.parse(localStorage.getItem("user") || "{}");
    sessionStorage.setItem("family-filter:" + parent.id, value);
    const url = new URL(window.location.href);
    if (value) url.searchParams.set("child", value);
    else url.searchParams.delete("child");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setEvent(null);
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setRows([]);
    setError("");
    setEvent(null);
    async function refresh() {
      try {
        const linked = (await family<GuardianChild[]>("/children")).filter(
          (c) => c.status === "accepted",
        );
        const data = await Promise.all(
          linked.map((c) => loadChild(c, section, month)),
        );
        if (active) {
          setChildren(linked);
          setRows(data);
          setError("");
        }
      } catch (e) {
        if (active) {
          setRows([]);
          setChildren([]);
          setError((e as Error).message);
        }
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
  }, [section, month, retry]);
  const invalid =
    !!filter && !loading && !children.some((c) => c.id === filter);
  const visible = rows.filter((r) => !filter || r.child.id === filter);
  const good = visible.filter((r) => !r.error);
  const events = mergeShared(
    good.map((r) => ({ child: r.child, values: r.calendar || [] })),
  )
    .filter(
      (r) =>
        (!kind || r.item.kind === kind) && (showCancelled || !r.item.cancelled),
    )
    .sort((a, b) => a.item.starts_at.localeCompare(b.item.starts_at));
  const posts = mergeShared(
    good.map((r) => ({ child: r.child, values: r.feed || [] })),
  )
    .filter(
      (r) =>
        (!kind || r.item.category === kind) &&
        (!query ||
          [r.item.title, r.item.body, r.item.team_name]
            .join(" ")
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) => b.item.created_at.localeCompare(a.item.created_at));
  const upcoming = events.filter(
    (r) => !r.item.cancelled && Date.parse(r.item.ends_at) >= Date.now(),
  );
  const managed = good.filter((r) => r.child.mode === "managed");
  const empty = (text: string) => (
    <div className={p.card}>
      <p>{text}</p>
    </div>
  );
  const monthControls = (
    <div className={p.toolbar}>
      <button
        className={s.secondary}
        aria-label="Previous month"
        onClick={() => setMonth(shiftMonth(month, -1))}
      >
        ←
      </button>
      <label>
        Month
        <input
          type="month"
          value={month}
          onChange={(e) => {
            if (/^\d{4}-\d{2}$/.test(e.target.value)) setMonth(e.target.value);
          }}
        />
      </label>
      <button
        className={s.secondary}
        aria-label="Next month"
        onClick={() => setMonth(shiftMonth(month, 1))}
      >
        →
      </button>
      <button
        className={s.textButton}
        onClick={() => setMonth(todayDate().slice(0, 7))}
      >
        This month
      </button>
    </div>
  );
  function renderEvents(list: typeof events) {
    return list.length ? (
      <div className={p.list}>
        {list.map((r) => (
          <button
            className={p.eventRow}
            key={r.item.id}
            onClick={() => setEvent(r)}
          >
            <ChildBadges children={r.children} />
            <strong>{r.item.title}</strong>
            <span>
              {dayLabel(r.item.date)} · {r.item.start_time.slice(0, 5)} ·{" "}
              {r.item.timezone}
            </span>
            <span>
              {r.item.team_name || "Personal session"} ·{" "}
              {r.item.venue || "Venue to be confirmed"}
            </span>
            {r.item.cancelled && <b>Cancelled</b>}
          </button>
        ))}
      </div>
    ) : (
      empty("No sessions to show for this selection.")
    );
  }
  function renderFeed(list: typeof posts) {
    return list.length ? (
      <div className={p.list}>
        {list.map((r) => (
          <article className={p.card} key={r.item.id}>
            <ChildBadges children={r.children} />
            <p className={p.meta}>
              {r.item.category.replaceAll("_", " ")} · {r.item.team_name}
            </p>
            <h3>{r.item.title}</h3>
            <p>
              {[r.item.coach_first_name, r.item.coach_last_name].join(" ")} ·{" "}
              {new Date(r.item.created_at).toLocaleString("en-ZA", {
                timeZone: "Africa/Johannesburg",
              })}{" "}
              SAST
            </p>
            <p className={p.postBody}>{r.item.body}</p>
          </article>
        ))}
      </div>
    ) : (
      empty("No team updates to show for this selection.")
    );
  }
  return (
    <div className={`${s.workspace} ${p.page}`}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR FAMILY. THEIR SPORT.</p>
          <h1>{titles[section][0]}</h1>
          <p className={s.subtitle}>{titles[section][1]}</p>
        </div>
        <Link href="/dashboard/parents/children" className={s.secondary}>
          Manage children ↗
        </Link>
      </header>
      <div className={p.familyFilter}>
        <label>
          Show children
          <select
            aria-label="Show children"
            value={filter}
            onChange={(e) => choose(e.target.value)}
          >
            <option value="">All children</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {fullName(c)}
              </option>
            ))}
            {invalid && (
              <option value={filter}>Child no longer available</option>
            )}
          </select>
        </label>
        <span>
          {filter
            ? "Showing one child across your family pages."
            : "Your children's information, together."}
        </span>
        <button className={s.secondary} onClick={() => setRetry((v) => v + 1)}>
          Refresh
        </button>
      </div>
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {["calendar", "overview"].includes(section) &&
        !loading &&
        managed.length > 0 && (
          <div className={p.actions}>
            {managed.map((r) => (
              <button
                key={r.child.id}
                className={s.primary}
                onClick={() => openSession(r.child)}
              >
                Add session for {r.child.first_name}
              </button>
            ))}
          </div>
        )}
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {invalid && (
        <p role="alert">
          This child is no longer available.{" "}
          <button className={s.textButton} onClick={() => choose("")}>
            Show all children
          </button>
        </p>
      )}
      {loading || !ready ? (
        <p role="status">Loading your family's information…</p>
      ) : !children.length && !error ? (
        empty(
          "Add a child or have an athlete approve your link in My children to get started.",
        )
      ) : (
        !invalid && (
          <>
            {visible
              .filter((r) => r.error)
              .map((r) => (
                <p role="alert" className={s.error} key={r.child.id}>
                  {fullName(r.child)}: {r.error}
                </p>
              ))}
            {section === "overview" && (
              <>
                <section className={p.hero}>
                  <span className={p.eyebrow}>{monthLabel(month)}</span>
                  <h2>Be there for every step.</h2>
                  <p>
                    {visible.length}{" "}
                    {visible.length === 1 ? "child" : "children"} ·{" "}
                    {upcoming.length} upcoming sessions this month ·{" "}
                    {good.reduce(
                      (n, r) =>
                        n +
                        (r.profile?.entries.filter(
                          (e) => e.kind === "achievement",
                        ).length || 0),
                      0,
                    )}{" "}
                    achievements
                  </p>
                </section>
                {monthControls}
                <div className={p.sectionHeading}>
                  <h2>Coming up</h2>
                  <Link href="/dashboard/parents/calendar">
                    Open family calendar ↗
                  </Link>
                </div>
                {renderEvents(upcoming.slice(0, 5))}
                <div className={p.sectionHeading}>
                  <h2>Latest team updates</h2>
                  <Link href="/dashboard/parents/feed">View Team Feed ↗</Link>
                </div>
                {renderFeed(posts.slice(0, 3))}
              </>
            )}
            {section === "calendar" && (
              <>
                {monthControls}
                <div className={p.toolbar}>
                  <label>
                    Session type
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="">All sessions & matches</option>
                      {Object.entries(KINDS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={showCancelled}
                      onChange={(e) => setShowCancelled(e.target.checked)}
                    />{" "}
                    Show cancelled
                  </label>
                </div>
                <section className={`${p.hero} ${p.calendarSummary}`}>
                  <h2>{monthLabel(month)}</h2>
                  <p>
                    {events.length} sessions · Shared team events appear once
                    with each linked child labelled.
                  </p>
                </section>
                <div className={p.calendarScroll}>
                  <div
                    className={p.calendar}
                    aria-label={monthLabel(month) + " family calendar"}
                  >
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (d) => (
                        <strong key={d}>{d}</strong>
                      ),
                    )}
                    {monthDays(month).map((date, i) => (
                      <div
                        key={date || i}
                        className={p.calendarDay}
                        data-today={date === todayDate()}
                      >
                        {date && (
                          <>
                            <b>{Number(date.slice(-2))}</b>
                            {events
                              .filter((r) => r.item.date === date)
                              .map((r) => (
                                <button
                                  key={r.item.id}
                                  onClick={() => setEvent(r)}
                                  className={p.calendarEvent}
                                  data-cancelled={r.item.cancelled}
                                >
                                  <strong>
                                    {r.item.cancelled
                                      ? "Cancelled"
                                      : r.item.start_time.slice(0, 5)}{" "}
                                    · {r.item.title}
                                  </strong>
                                  <span>
                                    {r.children
                                      .map((c) => c.first_name)
                                      .join(", ")}
                                  </span>
                                </button>
                              ))}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <h2 className={p.sectionHeading}>Sessions this month</h2>
                {renderEvents(events)}
              </>
            )}
            {section === "profile" && (
              <>
                <div className={p.tabs} aria-label="Profile sections">
                  {[
                    ["details", "My details"],
                    ["sports", "Sports & positions"],
                    ["achievement", "Achievements"],
                    ["metric", "Performance metrics"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      className={tab === key ? s.primary : s.secondary}
                      aria-pressed={tab === key}
                      onClick={() => setTab(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className={p.grid}>
                  {good.map((r) => (
                    <article key={r.child.id} className={p.card}>
                      <ChildBadges children={[r.child]} />
                      <h2>{fullName(r.child)}</h2>
                      <p>
                        {r.child.mode === "managed"
                          ? "Managed by you"
                          : "Read-only · Athlete-approved access"}
                      </p>
                      {tab === "details" && (
                        <>
                          <p>
                            {r.profile?.details.province || "Region not added"}
                          </p>
                          <p>
                            {r.profile?.details.bio ||
                              "Their sporting story is still taking shape."}
                          </p>
                        </>
                      )}
                      {tab === "sports" &&
                        (r.profile?.sports.length ? (
                          r.profile.sports.map((v, i) => (
                            <div key={i}>
                              <strong>{v.sport_name}</strong> ·{" "}
                              {v.position_name || "Position not added"}
                              {v.primary_position ? " · Primary position" : ""}
                              {r.child.mode === "managed" && (
                                <button
                                  className={s.textButton}
                                  onClick={() =>
                                    openProfile(r, {
                                      kind: "sport",
                                      sport: v.sport_id,
                                    })
                                  }
                                >
                                  Edit positions
                                </button>
                              )}
                            </div>
                          ))
                        ) : (
                          <p>No sports or positions added yet.</p>
                        ))}
                      {["achievement", "metric"].includes(tab) &&
                        (r.profile?.entries.some((e) => e.kind === tab) ? (
                          r.profile.entries
                            .filter((e) => e.kind === tab)
                            .map((e) => (
                              <div className={p.record} key={e.id}>
                                <h3>{e.title}</h3>
                                {e.value !== null && e.value !== undefined && (
                                  <strong>
                                    {e.value} {e.unit}
                                  </strong>
                                )}
                                <p>
                                  {[e.date, e.organization]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                                {e.notes && <p>{e.notes}</p>}
                                {r.child.mode === "managed" && (
                                  <button
                                    className={s.secondary}
                                    onClick={() =>
                                      openProfile(r, { kind: e.kind, entry: e })
                                    }
                                  >
                                    Edit {e.title}
                                  </button>
                                )}
                              </div>
                            ))
                        ) : (
                          <p>
                            No{" "}
                            {tab === "metric"
                              ? "performance metrics"
                              : "achievements"}{" "}
                            added yet.
                          </p>
                        ))}
                      {r.child.mode === "managed" && (
                        <button
                          className={s.primary}
                          onClick={() =>
                            openProfile(r, {
                              kind:
                                tab === "details"
                                  ? "personal"
                                  : tab === "sports"
                                    ? "sport"
                                    : tab === "achievement"
                                      ? "achievement"
                                      : "metric",
                            })
                          }
                        >
                          {tab === "achievement"
                            ? "Add achievement"
                            : tab === "metric"
                              ? "Record metric"
                              : tab === "sports"
                                ? "Add sport & positions"
                                : "Edit details"}{" "}
                          for {r.child.first_name}
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
            {section === "matches" && (
              <>
                <div className={p.toolbar}>
                  <label>
                    Show
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="">Results & upcoming</option>
                      <option value="results">Recorded results</option>
                      <option value="upcoming">Upcoming matches</option>
                    </select>
                  </label>
                </div>
                <div className={p.grid}>
                  {good.flatMap((r) =>
                    (r.matches || [])
                      .filter(
                        (m) =>
                          !kind ||
                          (kind === "results"
                            ? !!m.result
                            : !m.result && Date.parse(m.ends_at) >= Date.now()),
                      )
                      .map((m) => (
                        <article className={p.card} key={r.child.id + m.id}>
                          <ChildBadges children={[r.child]} />
                          <p className={p.meta}>{m.team_name}</p>
                          <h2>{m.title}</h2>
                          <p>
                            {dayLabel(m.date)} · {m.start_time.slice(0, 5)} ·{" "}
                            {m.timezone}
                          </p>
                          <p>{m.venue}</p>
                          {m.cancelled ? (
                            <strong>Cancelled</strong>
                          ) : m.result ? (
                            <h3>
                              {outcome(m.result)} · {m.result.team_score} –{" "}
                              {m.result.opponent_score} vs {m.result.opponent}
                            </h3>
                          ) : (
                            <p>
                              {Date.parse(m.ends_at) < Date.now()
                                ? "Awaiting result"
                                : "Upcoming fixture"}
                            </p>
                          )}
                          {m.stats && (
                            <div className={p.record}>
                              <h3>Personal contribution</h3>
                              <p>{m.stats.position}</p>
                              <p>
                                {[
                                  ["Minutes", m.stats.minutes],
                                  ["Tries", m.stats.tries],
                                  ["Tackles", m.stats.tackles],
                                  ["Conversions", m.stats.conversions],
                                  ["Penalty goals", m.stats.penalties],
                                ]
                                  .filter(
                                    ([, v]) => v !== null && v !== undefined,
                                  )
                                  .map(([k, v]) => k + ": " + v)
                                  .join(" · ")}
                              </p>
                              {m.stats.notes && <p>{m.stats.notes}</p>}
                              {m.stats.video_url &&
                                /^https?:\/\//i.test(m.stats.video_url) && (
                                  <a
                                    href={m.stats.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Watch match video ↗
                                  </a>
                                )}
                            </div>
                          )}
                          {r.child.mode === "managed" && (
                            <button
                              className={s.secondary}
                              onClick={() =>
                                editChild(r.child, "/dashboard/athlete/matches")
                              }
                            >
                              Manage {r.child.first_name}'s match stats ↗
                            </button>
                          )}
                        </article>
                      )),
                  )}
                </div>
                {!good.some((r) =>
                  r.matches?.some(
                    (m) =>
                      !kind ||
                      (kind === "results"
                        ? !!m.result
                        : !m.result && Date.parse(m.ends_at) >= Date.now()),
                  ),
                ) && empty("No matches to show for this selection.")}
              </>
            )}
            {section === "feed" && (
              <>
                <div className={p.toolbar}>
                  <label>
                    Search updates
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search announcements…"
                    />
                  </label>
                  <label>
                    Update type
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="">All updates</option>
                      {[
                        ["announcement", "Announcements"],
                        ["reminder", "Reminders"],
                        ["cancellation", "Cancellations"],
                        ["session_update", "Session updates"],
                      ].map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {renderFeed(posts)}
                <p className={p.meta}>
                  Latest 100 updates per child. Shared announcements appear
                  once. Updates refresh every minute.
                </p>
              </>
            )}
            {section === "activities" && (
              <>
                <div className={p.tabs}>
                  {[
                    ["details", "Training log"],
                    ["attendance", "Team attendance"],
                  ].map(([k, v]) => (
                    <button
                      key={k}
                      className={tab === k ? s.primary : s.secondary}
                      aria-pressed={tab === k}
                      onClick={() => setTab(k)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                {managed.map((r) =>
                  tab !== "attendance" ? (
                    <ParentTraining
                      key={r.child.id}
                      child={r.child}
                      activities={r.activities || []}
                    />
                  ) : (
                    <section className={p.card} key={r.child.id}>
                      <ChildBadges children={[r.child]} />
                      <div className={p.sectionHeading}>
                        <h2>
                          {r.child.first_name}'s{" "}
                          {tab === "attendance" ? "attendance" : "training"}
                        </h2>
                        <button
                          className={s.primary}
                          onClick={() =>
                            editChild(
                              r.child,
                              "/dashboard/athlete/activities" +
                                (tab === "attendance" ? "#attendance" : ""),
                            )
                          }
                        >
                          {tab === "attendance"
                            ? "Manage attendance"
                            : "Log or manage training"}{" "}
                          ↗
                        </button>
                      </div>
                      {tab === "attendance" ? (
                        r.attendance?.length ? (
                          r.attendance.map((e) => (
                            <div className={p.record} key={e.id}>
                              <strong>{e.title}</strong>
                              <p>
                                {e.date} · {e.team_name} ·{" "}
                                {e.cancelled
                                  ? "Cancelled"
                                  : attendanceLabel(
                                      e.attendance_status,
                                      e.attendance_method,
                                    )}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p>No team attendance recorded yet.</p>
                        )
                      ) : null}
                    </section>
                  ),
                )}
              </>
            )}
            {section === "connections" && (
              <div className={p.grid}>
                {managed.map((r) => (
                  <article className={p.card} key={r.child.id}>
                    <ChildBadges children={[r.child]} />
                    <h2>{r.child.first_name}'s team network</h2>
                    {r.connections?.people.length ? (
                      r.connections.people.map((person) => (
                        <div className={p.record} key={person.id}>
                          <strong>{person.name}</strong>
                          <p>
                            {person.role === "coach" ? "Coach" : "Teammate"} ·{" "}
                            {r.connections?.teams
                              .filter((t) => person.team_ids.includes(t.id))
                              .map((t) => t.name)
                              .join(", ")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p>
                        No connections yet. Share the child's coach code from My
                        children to link their team.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
            {["activities", "connections"].includes(section) &&
              visible.some((r) => r.child.mode === "view") && (
                <p className={p.card}>
                  Older athletes share their profile, achievements, calendar,
                  matches and Team Feed. Their private training log and
                  connections are not included in that approval.
                </p>
              )}
          </>
        )
      )}
      {event && (
        <Modal
          title={event.item.title}
          description="Session details for your family."
          close={() => setEvent(null)}
        >
          <ChildBadges children={event.children} />
          <p>
            {dayLabel(event.item.date)} · {event.item.start_time.slice(0, 5)}–
            {event.item.end_time.slice(0, 5)} · {event.item.timezone}
          </p>
          <p>{event.item.team_name || "Personal session"}</p>
          <p>{event.item.venue || "Venue to be confirmed"}</p>
          <p>{event.item.notes}</p>
          {event.item.source === "personal" &&
            !event.item.cancelled &&
            event.children
              .filter((c) => c.mode === "managed")
              .map((child) => (
                <div className={p.actions} key={child.id}>
                  <button
                    className={s.primary}
                    onClick={() => openSession(child, event.item)}
                  >
                    Edit personal session
                  </button>
                  <button
                    className={s.secondary}
                    onClick={() => {
                      setCancelSession({ child, event: event.item });
                      setEvent(null);
                    }}
                  >
                    Cancel personal session
                  </button>
                </div>
              ))}
          {event.item.cancelled && (
            <p role="status">This session has been cancelled.</p>
          )}
        </Modal>
      )}
      {profileEditor && (
        <ProfileEditor
          key={
            profileEditor.child.id +
            profileEditor.editor.kind +
            (profileEditor.editor.entry?.id || "")
          }
          profile={profileEditor.profile}
          editor={profileEditor.editor}
          description={`Editing ${fullName(profileEditor.child)}'s sporting profile.`}
          close={() => setProfileEditor(null)}
          saveRequest={(path = "", method = "GET", body) =>
            childWrite<Profile>(
              profileEditor.child,
              "/athlete-profile" + path,
              method,
              body,
            )
          }
          saved={() => {
            setNotice(`${fullName(profileEditor.child)}: profile saved.`);
            setProfileEditor(null);
            setRetry((v) => v + 1);
          }}
        />
      )}
      {sessionEditor && (
        <PersonalEditor
          event={sessionEditor.event}
          date={month === todayDate().slice(0, 7) ? todayDate() : month + "-01"}
          events={sessionEditor.events}
          childName={fullName(sessionEditor.child)}
          close={() => setSessionEditor(null)}
          saveRequest={<T,>(path: string, body?: unknown, method?: string) =>
            childWrite<T>(
              sessionEditor.child,
              "/team-hub" + path,
              method || "POST",
              body,
            )
          }
          saved={(e) => sessionSaved(sessionEditor.child, e)}
        />
      )}
      {cancelSession && (
        <CancelPersonal
          event={cancelSession.event}
          childName={fullName(cancelSession.child)}
          close={() => setCancelSession(null)}
          saveRequest={<T,>(path: string, body?: unknown, method?: string) =>
            childWrite<T>(
              cancelSession.child,
              "/team-hub" + path,
              method || "POST",
              body,
            )
          }
          saved={(e) => sessionSaved(cancelSession.child, e)}
        />
      )}
    </div>
  );
}
