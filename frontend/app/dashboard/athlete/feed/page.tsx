"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hub, type HubTeam } from "../../team-hub/api";
import s from "../../coaches/workspace.module.css";
import f from "./feed.module.css";
export type FeedPost = {
  id: string;
  team_id: string;
  title: string;
  body: string;
  team_name: string;
  category: string;
  created_at: string;
  coach_first_name: string;
  coach_last_name: string;
};
const types: Record<string, string> = {
  announcement: "Announcement",
  reminder: "Reminder",
  cancellation: "Cancellation",
  session_update: "Session update",
};
function recentPriority(posts: FeedPost[], now: number) {
  return posts
    .filter(
      (p) =>
        ["cancellation", "reminder", "session_update"].includes(p.category) &&
        Date.parse(p.created_at) >= now - 7 * 86400000 &&
        Date.parse(p.created_at) <= now,
    )
    .slice(0, 3);
}
function timestamp(value: string) {
  return (
    new Date(value).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Johannesburg",
    }) + " SAST"
  );
}
function Update({ post }: { post: FeedPost }) {
  const [expanded, setExpanded] = useState(false);
  const long = post.body.length > 400;
  const name =
    [post.coach_first_name, post.coach_last_name].filter(Boolean).join(" ") ||
    "Your coach";
  return (
    <article
      id={`update-${post.id}`}
      className={`${f.card} ${post.category === "cancellation" ? f.cancelled : post.category === "reminder" ? f.reminder : ""}`}
    >
      <div className={f.meta}>
        <strong>{post.team_name}</strong>
        <span className={f.badge} data-kind={post.category}>
          {types[post.category] || "Update"}
        </span>
      </div>
      <h3>{post.title}</h3>
      <div className={f.byline}>
        <span className={f.avatar} aria-hidden="true">
          {name
            .split(/\s+/)
            .map((v) => v[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <span>
          {name}
          <time dateTime={post.created_at}>{timestamp(post.created_at)}</time>
        </span>
      </div>
      <p className={f.message} id={`message-${post.id}`}>
        {long && !expanded ? post.body.slice(0, 400) + "…" : post.body}
      </p>
      {long && (
        <button
          className={s.textButton}
          aria-expanded={expanded}
          aria-controls={`message-${post.id}`}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Read full update"}
        </button>
      )}
      {post.category === "cancellation" && (
        <div className={f.footer}>
          <span>Check your calendar before travelling to this session.</span>
          <Link href="/dashboard/athlete/calendar">Open calendar ↗</Link>
        </div>
      )}
    </article>
  );
}
export default function AthleteFeed() {
  const [team, setTeam] = useState(""),
    [category, setCategory] = useState(""),
    [query, setQuery] = useState(""),
    [retry, setRetry] = useState(0),
    [data, setData] = useState<{
      team: string;
      teams: HubTeam[];
      posts: FeedPost[];
      updated: number;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    async function refresh() {
      try {
        const [teams, posts] = await Promise.all([
          hub<HubTeam[]>("/teams"),
          hub<FeedPost[]>(
            `/feed${team ? "?team=" + encodeURIComponent(team) : ""}`,
          ),
        ]);
        if (active) {
          setData({
            team,
            teams,
            posts: [...posts].sort(
              (a, b) =>
                Date.parse(b.created_at) - Date.parse(a.created_at) ||
                b.id.localeCompare(a.id),
            ),
            updated: Date.now(),
          });
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setBusy(false);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [team, retry]);
  const current = data?.team === team ? data : null;
  const posts = current?.posts || [];
  const visible = posts.filter(
    (p) =>
      (!category || p.category === category) &&
      [p.title, p.body, p.team_name, p.coach_first_name, p.coach_last_name]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const priority = recentPriority(visible, current?.updated || Date.now());
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>FROM YOUR COACHES</p>
          <h1>Team Feed</h1>
          <p className={s.subtitle}>
            Know the plan. Catch the changes. Arrive prepared.
          </p>
        </div>
        <Link className={s.primary} href="/dashboard/athlete/calendar">
          Open my calendar ↗
        </Link>
      </header>
      <section className={f.hero}>
        <div>
          <p className={f.eyebrow}>YOUR TEAM, IN THE LOOP</p>
          <h2>Every update. One place.</h2>
          <p>
            Announcements, training reminders and changes of plan from the
            coaches of your linked teams.
          </p>
        </div>
        <div className={f.summary}>
          <strong>{current ? posts.length : "—"}</strong>
          <span>{posts.length === 1 ? "update" : "updates"} in this feed</span>
        </div>
      </section>
      <section className={f.filters} aria-label="Feed filters">
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {data?.teams.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
                {t.age_group ? " · " + t.age_group : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search updates
          <input
            type="search"
            placeholder="Subject, message or coach"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          className={s.secondary}
          disabled={busy}
          onClick={() => setRetry((v) => v + 1)}
        >
          {busy ? "Refreshing…" : "Refresh updates"}
        </button>
      </section>
      <div className={f.types} aria-label="Update type">
        {[
          ["", "All updates"],
          ["cancellation", "Cancellations"],
          ["reminder", "Reminders"],
          ["session_update", "Session updates"],
          ["announcement", "Announcements"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={category === key}
            onClick={() => setCategory(key)}
            className={category === key ? s.primary : s.secondary}
          >
            {label}
            {current
              ? ` (${key ? posts.filter((p) => p.category === key).length : posts.length})`
              : ""}
          </button>
        ))}
      </div>
      {error && (
        <div className={s.error} role="alert">
          <span>
            {error}
            {current ? " Showing previously loaded updates." : ""}
          </span>
          <button
            className={s.secondary}
            onClick={() => {
              setTeam("");
              setRetry((v) => v + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      {!current && busy && (
        <div className={s.loading} role="status">
          Loading team updates…
        </div>
      )}
      {current && (
        <>
          {priority.length > 0 && (
            <section
              className={f.priority}
              aria-label="Recent changes and reminders"
            >
              <div>
                <h2>Recent changes & reminders</h2>
                <span>Posted in the last 7 days</span>
              </div>
              <ul>
                {priority.map((p) => (
                  <li key={p.id}>
                    <span className={f.badge} data-kind={p.category}>
                      {types[p.category]}
                    </span>
                    <a href={`#update-${p.id}`}>
                      {p.title}
                      <span>{p.team_name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <div className={f.listHeading}>
            <h2>{category ? types[category] + "s" : "Latest updates"}</h2>
            <span aria-live="polite">
              {visible.length} {visible.length === 1 ? "update" : "updates"} ·
              newest first
            </span>
          </div>
          {!current.teams.length ? (
            <section className={f.empty}>
              <h3>Your team updates start here.</h3>
              <p>
                Ask your coach to link your registered email to your player
                record. Their announcements and session changes will then appear
                here.
              </p>
              <Link
                className={s.secondary}
                href="/dashboard/athlete/connections"
              >
                View my connections ↗
              </Link>
            </section>
          ) : !posts.length ? (
            <section className={f.empty}>
              <h3>No team updates yet.</h3>
              <p>
                Your coach’s next announcement will appear here. You can still
                check your scheduled sessions in Calendar.
              </p>
            </section>
          ) : !visible.length ? (
            <section className={f.empty}>
              <h3>No updates match your filters.</h3>
              <p>Try another search or update type.</p>
              <button
                className={s.secondary}
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
              >
                Clear filters
              </button>
            </section>
          ) : (
            <div className={f.list}>
              {visible.map((p) => (
                <Update key={p.id} post={p} />
              ))}
            </div>
          )}
          <p className={f.note}>
            Showing up to the latest 100 updates for the selected team filter.
            Updates refresh automatically every minute. Times are shown in South
            African time.
          </p>
        </>
      )}
    </div>
  );
}
