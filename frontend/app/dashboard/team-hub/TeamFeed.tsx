"use client";
import { useEffect, useState, type FormEvent } from "react";
import { hub, type HubTeam } from "./api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import h from "./hub.module.css";
type Post = {
  id: string;
  title: string;
  body: string;
  team_name: string;
  category: string;
  created_at: string;
  coach_first_name: string;
  coach_last_name: string;
};
export default function TeamFeed({ coach = false }: { coach?: boolean }) {
  const [teams, setTeams] = useState<HubTeam[]>([]),
    [posts, setPosts] = useState<Post[]>([]),
    [team, setTeam] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [editor, setEditor] = useState(false),
    [remove, setRemove] = useState<Post | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    hub<HubTeam[]>("/teams")
      .then((t) => {
        if (active) setTeams(t);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const load = () =>
      hub<Post[]>(`/feed${team ? `?team=${team}` : ""}`)
        .then((p) => {
          if (active) setPosts(p);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [team, retry]);
  async function deletePost() {
    if (!remove) return;
    setBusy(true);
    try {
      await hub(`/feed/${remove.id}`, undefined, "DELETE");
      setRemove(null);
      setNotice("Announcement removed.");
      setRetry((n) => n + 1);
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
          <h1>Team feed</h1>
          <p className={s.subtitle}>
            {coach
              ? "Keep your players in the loop."
              : "Updates and reminders from your coaches."}
          </p>
        </div>
        {coach && (
          <button
            className={s.primary}
            disabled={!teams.length}
            onClick={() => setEditor(true)}
          >
            + Post an update
          </button>
        )}
      </header>
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      <div className={h.filters}>
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
        <span className={h.help}>
          Updates appear here for linked, active team members.
        </span>
      </div>
      {loading ? (
        <p role="status">Loading team updates…</p>
      ) : !posts.length ? (
        <section className={s.empty}>
          <h2>No team updates yet.</h2>
          <p>
            {coach
              ? "Post a reminder, an announcement or a change of plans. Link athletes to your roster so they can read it."
              : !teams.length
                ? "Ask your coach to link your registered email to your player record."
                : "Your coach’s next update will appear here."}
          </p>
        </section>
      ) : (
        <div className={h.stack}>
          {posts.map((post) => (
            <article className={h.card} key={post.id}>
              <div className={h.meta}>
                <strong>{post.team_name}</strong>
                <span>{new Date(post.created_at).toLocaleString("en-ZA")}</span>
                <span
                  className={`${h.badge} ${post.category === "cancellation" ? h.cancelled : ""}`}
                >
                  {post.category}
                </span>
              </div>
              <h2>{post.title}</h2>
              <p className={h.message}>{post.body}</p>
              <div className={h.row}>
                <span className={h.help}>
                  {[post.coach_first_name, post.coach_last_name]
                    .filter(Boolean)
                    .join(" ") || "Coach"}
                </span>
                {coach && post.category !== "cancellation" && (
                  <button
                    className={s.textButton}
                    onClick={() => setRemove(post)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      {editor && (
        <PostEditor
          teams={teams}
          initialTeam={team}
          close={() => setEditor(false)}
          saved={() => {
            setEditor(false);
            setNotice("Update posted to the team feed.");
            setRetry((n) => n + 1);
          }}
        />
      )}
      {remove && (
        <Modal
          title="Remove announcement?"
          description={remove.title}
          close={() => !busy && setRemove(null)}
        >
          <p>The update will no longer appear in the team feed.</p>
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
  close,
  saved,
}: {
  teams: HubTeam[];
  initialTeam: string;
  close: () => void;
  saved: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setError("");
    try {
      await hub("/feed", body);
      saved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Post a team update"
      description="Visible in the team feed to linked, active athletes. No email or SMS is sent."
      close={() => !busy && close()}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset className={h.formFields} disabled={busy}>
          <label>
            Team
            <select
              name="team_id"
              defaultValue={initialTeam || teams[0]?.id}
              required
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.age_group}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select name="category">
              <option value="announcement">Announcement</option>
              <option value="reminder">Reminder</option>
            </select>
          </label>
          <label>
            Subject
            <input
              name="title"
              required
              maxLength={120}
              placeholder="e.g. Bring boots and a water bottle"
            />
          </label>
          <label>
            Message
            <textarea name="body" required maxLength={3000} rows={5} />
          </label>
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
          <button className={s.primary} disabled={busy}>
            {busy ? "Posting…" : "Post to team"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
