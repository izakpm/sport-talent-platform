"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { hub, type HubTeam } from "./api";
import { Modal } from "../coaches/CoachWorkspace";
import {
  planningRequest,
  monthBounds,
  todayDate,
  type Session,
} from "../coaches/planning";
import s from "../coaches/workspace.module.css";
import h from "./hub.module.css";
import f from "../athlete/feed/feed.module.css";
type Post = {
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
const labels: Record<string, string> = {
  announcement: "Announcement",
  reminder: "Reminder",
  session_update: "Session update",
  cancellation: "Cancellation",
};
export default function TeamFeed({ coach = false }: { coach?: boolean }) {
  const [data, setData] = useState<{
      team: string;
      teams: HubTeam[];
      posts: Post[];
    } | null>(null),
    [team, setTeam] = useState(""),
    [category, setCategory] = useState(""),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [editor, setEditor] = useState<string | null>(null),
    [remove, setRemove] = useState<Post | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    async function load() {
      try {
        const [teams, posts] = await Promise.all([
          hub<HubTeam[]>("/teams"),
          hub<Post[]>(
            `/feed${team ? "?team=" + encodeURIComponent(team) : ""}`,
          ),
        ]);
        if (active) {
          setData({ team, teams, posts });
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [team, retry]);
  const current = data?.team === team ? data : null,
    teams = data?.teams || [],
    posts = current?.posts || [];
  const visible = posts.filter(
    (p) =>
      (!category || p.category === category) &&
      [p.title, p.body, p.team_name]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  async function deletePost() {
    if (!remove) return;
    setBusy(true);
    try {
      await hub(`/feed/${remove.id}`, undefined, "DELETE");
      setData((v) =>
        v ? { ...v, posts: v.posts.filter((p) => p.id !== remove.id) } : v,
      );
      setRemove(null);
      setNotice("Update removed from the team feed.");
      setRetry((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>TEAM COMMUNICATION</p>
          <h1>Team Feed</h1>
          <p className={s.subtitle}>A clear message. A prepared team.</p>
        </div>
        {coach && (
          <button
            className={s.primary}
            disabled={!teams.length}
            onClick={() => setEditor("announcement")}
          >
            + Post an update
          </button>
        )}
      </header>
      <section className={f.hero}>
        <div>
          <p className={f.eyebrow}>KEEP EVERYONE IN THE LOOP</p>
          <h2>Set the plan. Share the update.</h2>
          <p>
            Send announcements, kit reminders and session updates to the
            athletes linked to your teams.
          </p>
          {coach && (
            <div className={h.composeActions}>
              {[
                ["announcement", "Announcement"],
                ["reminder", "Reminder"],
                ["session_update", "Session update"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={s.secondary}
                  disabled={!teams.length}
                  onClick={() => setEditor(key)}
                >
                  {label} +
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={f.summary}>
          <strong>{current ? posts.length : "—"}</strong>
          <span>updates in this feed</span>
        </div>
      </section>
      {notice && (
        <div role="status" className={s.notice}>
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div role="alert" className={s.error}>
          <span>
            {error}
            {current ? " Showing the last loaded updates." : ""}
          </span>
          <button
            className={s.secondary}
            onClick={() => {
              setTeam("");
              setRetry((v) => v + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      <section className={f.filters} aria-label="Feed filters">
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.age_group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Search updates
          <input
            type="search"
            placeholder="Subject, message or team"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button
          className={s.secondary}
          disabled={loading}
          onClick={() => setRetry((v) => v + 1)}
        >
          {loading ? "Refreshing…" : "Refresh updates"}
        </button>
      </section>
      <div className={f.types}>
        {[
          ["", "All updates"],
          ...Object.entries(labels).map(([k, v]) => [k, v + "s"]),
        ].map(([key, label]) => (
          <button
            className={category === key ? s.primary : s.secondary}
            aria-pressed={category === key}
            key={key}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {!current && loading && (
        <div className={s.loading} role="status">
          Loading team updates…
        </div>
      )}
      {current && (
        <>
          <div className={f.listHeading}>
            <h2>Team updates</h2>
            <span>
              {visible.length} {visible.length === 1 ? "update" : "updates"} ·
              newest first
            </span>
          </div>
          {!posts.length ? (
            <section className={f.empty}>
              <h3>No team updates yet.</h3>
              <p>
                {!teams.length
                  ? "Create a team first, then link athletes to its roster so they receive your updates."
                  : "Post your first announcement, reminder or session update to keep your team informed."}
              </p>
              {coach &&
                (!teams.length ? (
                  <Link className={s.primary} href="/dashboard/coaches/teams">
                    Create a team ↗
                  </Link>
                ) : (
                  <button
                    className={s.primary}
                    onClick={() => setEditor("announcement")}
                  >
                    Write the first update
                  </button>
                ))}
            </section>
          ) : !visible.length ? (
            <section className={f.empty}>
              <h3>No updates match your filters.</h3>
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
                <article
                  className={`${f.card} ${p.category === "cancellation" ? f.cancelled : p.category === "reminder" ? f.reminder : ""}`}
                  key={p.id}
                >
                  <div className={f.meta}>
                    <strong>{p.team_name}</strong>
                    <span className={f.badge} data-kind={p.category}>
                      {labels[p.category] || "Update"}
                    </span>
                  </div>
                  <h3>{p.title}</h3>
                  <div className={f.byline}>
                    <span>
                      {[p.coach_first_name, p.coach_last_name]
                        .filter(Boolean)
                        .join(" ") || "Coach"}
                      <time dateTime={p.created_at}>
                        {new Date(p.created_at).toLocaleString("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                        })}{" "}
                        SAST
                      </time>
                    </span>
                  </div>
                  <p className={f.message}>{p.body}</p>
                  {coach && (
                    <div className={f.footer}>
                      {p.category === "cancellation" ? (
                        <span>
                          Posted automatically when the session was cancelled.
                        </span>
                      ) : (
                        <button
                          className={s.textButton}
                          onClick={() => {
                            setError("");
                            setRemove(p);
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className={f.note}>
            Latest 100 updates for this team filter. Visible in Team Feed to
            linked, active athletes; no email or SMS is sent. Refreshes every
            minute.
          </p>
        </>
      )}
      {editor && (
        <PostEditor
          teams={teams}
          initialTeam={team}
          initialCategory={editor}
          close={() => setEditor(null)}
          saved={(id) => {
            setEditor(null);
            setTeam(id);
            setCategory("");
            setQuery("");
            setNotice("Update posted to the team feed.");
            setRetry((v) => v + 1);
          }}
        />
      )}
      {remove && (
        <Modal
          title="Remove update?"
          description={`${remove.team_name} · ${remove.title}`}
          close={() => {
            if (!busy) setRemove(null);
          }}
        >
          <p>This update will no longer appear in the team feed.</p>
          {error && (
            <p className={s.error} role="alert">
              {error}
            </p>
          )}
          <div className={s.formFooter}>
            <button
              className={s.secondary}
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Keep update
            </button>
            <button className={s.danger} disabled={busy} onClick={deletePost}>
              {busy ? "Removing…" : "Remove update"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function PostEditor({
  teams,
  initialTeam,
  initialCategory,
  close,
  saved,
}: {
  teams: HubTeam[];
  initialTeam: string;
  initialCategory: string;
  close: () => void;
  saved: (id: string) => void;
}) {
  const [team, setTeam] = useState(initialTeam || teams[0]?.id || ""),
    [category, setCategory] = useState(initialCategory),
    [month, setMonth] = useState(todayDate().slice(0, 7)),
    [sessions, setSessions] = useState<Session[]>([]),
    [event, setEvent] = useState(""),
    [sessionError, setSessionError] = useState(""),
    [sessionLoading, setSessionLoading] = useState(false),
    [retry, setRetry] = useState(0),
    [title, setTitle] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [preview, setPreview] = useState(false);
  useEffect(() => {
    if (category !== "session_update") return;
    let active = true;
    setEvent("");
    setSessions([]);
    setSessionLoading(true);
    setSessionError("");
    const { from, to } = monthBounds(month);
    planningRequest<Session[]>(`/events?from=${from}&to=${to}`)
      .then((rows) => {
        if (active)
          setSessions(rows.filter((e) => e.team_id === team && !e.cancelled));
      })
      .catch((e) => {
        if (active) setSessionError(e.message);
      })
      .finally(() => {
        if (active) setSessionLoading(false);
      });
    return () => {
      active = false;
    };
  }, [team, month, category, retry]);
  const chosen = sessions.find((s) => s.id === event);
  const target = teams.find((t) => t.id === team);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await hub("/feed", {
        team_id: team,
        category,
        title,
        body: message,
        ...(category === "session_update" ? { event_id: event } : {}),
      });
      saved(team);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Post a team update"
      description="Choose the team, write your message and preview it before posting."
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset className={h.formFields} disabled={busy}>
          <label>
            Team
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              required
            >
              {teams.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name} · {t.age_group}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setEvent("");
              }}
            >
              <option value="announcement">Announcement</option>
              <option value="reminder">Reminder</option>
              <option value="session_update">Session update</option>
            </select>
          </label>
          {category === "session_update" && (
            <>
              <label>
                Session month
                <input
                  type="month"
                  min="2000-01"
                  max="2100-12"
                  value={month}
                  onChange={(e) => {
                    if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(e.target.value))
                      setMonth(e.target.value);
                  }}
                />
              </label>
              <label>
                Scheduled session
                <select
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  required
                  disabled={sessionLoading || !!sessionError}
                >
                  <option value="">
                    {sessionLoading ? "Loading sessions…" : "Choose a session"}
                  </option>
                  {sessions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.date} · {e.start_time} · {e.title}
                    </option>
                  ))}
                </select>
              </label>
              {sessionError ? (
                <div className={s.error} role="alert">
                  {sessionError}
                  <button type="button" onClick={() => setRetry((v) => v + 1)}>
                    Retry sessions
                  </button>
                </div>
              ) : !sessionLoading && !sessions.length ? (
                <p>
                  No active sessions for this team in this month. Choose another
                  month or add one in Schedule.
                </p>
              ) : null}
              <p className={h.help}>
                This posts a message about the session. To change its date or
                venue, update Schedule first. To cancel it, use Verification’s
                session controls; that also posts a cancellation notice.
              </p>
            </>
          )}
          <label>
            Subject
            <input
              required
              maxLength={120}
              placeholder={
                category === "reminder"
                  ? "e.g. Bring boots and water"
                  : "e.g. This week’s team update"
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label>
            Message
            <textarea
              required
              maxLength={category === "session_update" ? 2500 : 3000}
              rows={5}
              placeholder="What does your team need to know?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <p className={h.help}>
            {message.length} / {category === "session_update" ? 2500 : 3000}{" "}
            characters · Posting to {target?.name}. Only linked, active athletes
            can read this update.
          </p>
          <button
            className={s.secondary}
            type="button"
            aria-expanded={preview}
            onClick={() => setPreview((v) => !v)}
          >
            {preview ? "Hide preview" : "Preview update"}
          </button>
          {preview && (
            <section className={h.card} aria-label="Update preview">
              <span className={f.badge}>
                {labels[category]} · {target?.name}
              </span>
              <h3>{title || "Your subject"}</h3>
              {chosen && (
                <p>
                  {chosen.title} · {chosen.date} · {chosen.start_time}–
                  {chosen.end_time}
                  {chosen.venue ? " · " + chosen.venue : ""}
                </p>
              )}
              <p className={f.message}>
                {message || "Your message will appear here."}
              </p>
            </section>
          )}
        </fieldset>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        <div className={s.formFooter}>
          <button
            type="button"
            className={s.secondary}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button
            className={s.primary}
            disabled={
              busy ||
              (category === "session_update" &&
                (!chosen || sessionLoading || !!sessionError))
            }
          >
            {busy ? "Posting…" : "Post to team"}
          </button>
        </div>
        <p className={h.help}>
          Posts appear in Team Feed. No email or SMS is sent.
        </p>
      </form>
    </Modal>
  );
}
