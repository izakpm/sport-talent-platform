"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../../coaches/CoachWorkspace";
import {
  training,
  trainingStatus,
  trainingDate,
  type TrainingActivity,
  type TrainingOptions,
} from "../../team-hub/training-api";
import { notifyAttendance } from "../../team-hub/api";
import s from "../../coaches/workspace.module.css";
import a from "./activities.module.css";
type Action = {
  kind: "request" | "withdraw" | "delete";
  activity: TrainingActivity;
};
export default function AthleteActivities() {
  const [data, setData] = useState<TrainingActivity[] | null>(null),
    [options, setOptions] = useState<TrainingOptions | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0),
    [editor, setEditor] = useState<TrainingActivity | "new" | null>(null),
    [action, setAction] = useState<Action | null>(null),
    [status, setStatus] = useState(""),
    [sport, setSport] = useState(""),
    [kind, setKind] = useState(""),
    [query, setQuery] = useState(""),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () =>
      Promise.all([
        training<TrainingActivity[]>(),
        training<TrainingOptions>("/options"),
      ])
        .then(([rows, choices]) => {
          if (active) {
            setData(rows);
            setOptions(choices);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [retry]);
  function saved(rows: TrainingActivity[], message: string) {
    setData(rows);
    setNotice(message);
    setError("");
    setEditor(null);
    setAction(null);
    notifyAttendance();
  }
  const visible = (data || []).filter(
    (v) =>
      (!status || v.status === status) &&
      (!sport || v.sport_id === sport) &&
      (!kind || v.training_kind === kind) &&
      (!from || v.date >= from) &&
      (!to || v.date <= to) &&
      (!query ||
        [v.title, v.location, v.description]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const cutoff = new Date(Date.now() - 29 * 86400000).toLocaleDateString(
    "en-CA",
    { timeZone: "Africa/Johannesburg" },
  );
  const recent = (data || []).filter(
    (v) => v.date >= cutoff && v.date <= today,
  );
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={a.eyebrow}>MY TRAINING LOG</p>
          <h2>Put your work on record.</h2>
          <p className={s.subtitle}>
            Log the session. Capture the detail. Ask your coach to confirm it.
          </p>
        </div>
        <button
          className={s.primary}
          disabled={!options}
          onClick={() => setEditor("new")}
        >
          Log training session +
        </button>
      </header>
      {error && (
        <p role="alert" className={s.error}>
          {error} {data && "Showing your last loaded records."}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      <section className={a.summary}>
        <div>
          <span>LAST 30 DAYS</span>
          <strong>
            {data ? recent.length : "—"} <small>sessions logged</small>
          </strong>
        </div>
        <div>
          <span>TRAINING TIME · LAST 30 DAYS</span>
          <strong>
            {data
              ? Math.round(
                  (recent.reduce((n, v) => n + (v.duration_minutes || 0), 0) /
                    60) *
                    10,
                ) / 10
              : "—"}{" "}
            <small>hours</small>
          </strong>
        </div>
        <div>
          <span>AWAITING YOUR COACH</span>
          <strong>
            {data ? data.filter((v) => v.status === "pending").length : "—"}{" "}
            <small>
              {data?.filter((v) => v.status === "pending").length === 1
                ? "request"
                : "requests"}
            </small>
          </strong>
        </div>
      </section>
      <aside className={a.tip}>
        <div>
          <strong>Attended a scheduled team session?</strong>
          <p>
            Use your team attendance record to request confirmation or scan your
            coach’s QR code at training. No separate log is needed.
          </p>
        </div>
        <a href="#attendance">Team attendance ↗</a>
      </aside>
      <div className={a.filters}>
        <label>
          Search
          <input
            type="search"
            placeholder="Session, venue or notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Sport
          <select value={sport} onChange={(e) => setSport(e.target.value)}>
            <option value="">All sports</option>
            {options?.sports.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Session type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All types</option>
            {options?.kinds.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {[
              "self_reported",
              "pending",
              "verified",
              "declined",
              "legacy_verified",
            ].map((v) => (
              <option key={v} value={v}>
                {trainingStatus(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            min={from || undefined}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      {(query || sport || kind || status || from || to) && (
        <div className={a.results}>
          <span>{visible.length} matching sessions</span>
          <button
            className={s.textButton}
            onClick={() => {
              setQuery("");
              setSport("");
              setKind("");
              setStatus("");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      {!data && !error ? (
        <p role="status">Loading your training log…</p>
      ) : data && !visible.length ? (
        <section className={s.empty}>
          <h2>
            {data.length
              ? "No sessions match these filters."
              : "Every session counts."}
          </h2>
          <p>
            {data.length
              ? "Try another date, sport or status."
              : "Start with a completed practice, gym session, fitness test or recovery session."}
          </p>
          {!data.length && (
            <button className={s.primary} onClick={() => setEditor("new")}>
              Log your first session
            </button>
          )}
        </section>
      ) : (
        <div className={a.list}>
          {visible.map((v) => {
            const locked = ["pending", "verified", "legacy_verified"].includes(
              v.status,
            );
            return (
              <article className={a.card} key={v.id}>
                <div className={a.cardHead}>
                  <div>
                    <p className={a.meta}>
                      {trainingDate(v.date)}
                      {v.time ? ` · ${v.time} SAST` : ""} ·{" "}
                      {v.sport || "Sport not recorded"}
                    </p>
                    <h2>{v.title || "Training session"}</h2>
                  </div>
                  <span
                    className={`${a.badge} ${v.status === "verified" ? a.verified : ""}`}
                  >
                    {trainingStatus(v.status)}
                  </span>
                </div>
                <div className={a.facts}>
                  <span>{v.training_kind}</span>
                  {v.duration_minutes != null && (
                    <span>{v.duration_minutes} min</span>
                  )}
                  {v.effort != null && <span>Effort {v.effort}/10</span>}
                  {v.location && <span>{v.location}</span>}
                </div>
                {v.description && <p className={a.notes}>{v.description}</p>}
                {v.coach_name && (
                  <p className={a.coach}>Coach: {v.coach_name}</p>
                )}
                {v.review_note && (
                  <p className={a.feedback}>
                    <strong>Coach feedback:</strong> {v.review_note}
                  </p>
                )}
                <footer className={a.footer}>
                  <div className={a.actions}>
                    {!locked && (
                      <>
                        <button
                          className={s.primary}
                          onClick={() =>
                            setAction({ kind: "request", activity: v })
                          }
                        >
                          {v.status === "declined"
                            ? "Request again"
                            : "Request verification"}
                        </button>
                        <button
                          className={s.secondary}
                          onClick={() => setEditor(v)}
                        >
                          Edit
                        </button>
                        <button
                          className={s.textButton}
                          onClick={() =>
                            setAction({ kind: "delete", activity: v })
                          }
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {v.status === "pending" && (
                      <button
                        className={s.secondary}
                        onClick={() =>
                          setAction({ kind: "withdraw", activity: v })
                        }
                      >
                        Withdraw request
                      </button>
                    )}
                  </div>
                  <small>
                    {v.status === "pending"
                      ? "Withdraw before editing."
                      : locked
                        ? "Confirmed record · editing locked."
                        : "Self-reported until a coach confirms it."}
                  </small>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      {editor && options && (
        <TrainingEditor
          activity={editor === "new" ? null : editor}
          options={options}
          close={() => setEditor(null)}
          saved={(rows) =>
            saved(
              rows,
              "Session saved. You can now request verification from its card.",
            )
          }
        />
      )}
      {action && options && (
        <TrainingAction
          action={action}
          options={options}
          close={() => setAction(null)}
          saved={(rows) =>
            saved(
              rows,
              action.kind === "request"
                ? "Verification request sent to your coach."
                : action.kind === "withdraw"
                  ? "Request withdrawn. You can edit this session."
                  : "Session deleted.",
            )
          }
        />
      )}
    </div>
  );
}
export function TrainingEditor({
  activity,
  options,
  close,
  saved,
  saveRequest = training,
  childName,
}: {
  activity: TrainingActivity | null;
  options: TrainingOptions;
  close: () => void;
  saved: (rows: TrainingActivity[]) => void;
  saveRequest?: typeof training;
  childName?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const body = {
        title: f.get("title"),
        sport_id: f.get("sport_id"),
        training_kind: f.get("training_kind"),
        date: f.get("date"),
        time: f.get("time"),
        duration_minutes: Number(f.get("duration_minutes")),
        location: f.get("location"),
        description: f.get("description"),
        effort: f.get("effort") ? Number(f.get("effort")) : null,
      };
      saved(
        await saveRequest<TrainingActivity[]>(
          activity ? "/" + activity.id : "",
          activity ? "PUT" : "POST",
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
      title={activity ? "Edit training session" : "Log a training session"}
      description={`${childName ? childName + " · " : ""}Record a completed session. All times are South African time (SAST).`}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset disabled={busy} className={a.fieldset}>
          <label>
            Session title
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={activity?.title || ""}
              placeholder="e.g. Strength session — lower body"
            />
          </label>
          <div className={s.formRow}>
            <label>
              Sport
              <select
                name="sport_id"
                required
                defaultValue={
                  activity?.sport_id ||
                  (options.sports.length === 1 ? options.sports[0].id : "")
                }
              >
                <option value="">Choose sport</option>
                {options.sports.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Session type
              <select
                name="training_kind"
                required
                defaultValue={
                  options.kinds.includes(activity?.training_kind || "")
                    ? activity?.training_kind
                    : "Practice"
                }
              >
                {options.kinds.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={s.formRow}>
            <label>
              Date
              <input
                name="date"
                type="date"
                required
                min="1900-01-01"
                max={new Date().toLocaleDateString("en-CA", {
                  timeZone: "Africa/Johannesburg",
                })}
                defaultValue={
                  activity?.date ||
                  new Date().toLocaleDateString("en-CA", {
                    timeZone: "Africa/Johannesburg",
                  })
                }
              />
            </label>
            <label>
              Start time (SAST)
              <input
                name="time"
                required
                type="time"
                defaultValue={activity?.time || ""}
              />
            </label>
          </div>
          <div className={s.formRow}>
            <label>
              Duration (minutes)
              <input
                name="duration_minutes"
                type="number"
                min="1"
                max="1440"
                step="1"
                required
                defaultValue={activity?.duration_minutes || 60}
              />
            </label>
            <label>
              Effort (optional)
              <select name="effort" defaultValue={activity?.effort ?? ""}>
                <option value="">Not recorded</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}
                    {i === 0 ? " — very easy" : i === 9 ? " — maximal" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Venue (optional)
            <input
              name="location"
              maxLength={160}
              defaultValue={activity?.location || ""}
            />
          </label>
          <label>
            Session notes
            <textarea
              name="description"
              rows={4}
              maxLength={2000}
              defaultValue={activity?.description || ""}
              placeholder="What did you work on? Include drills, sets, reps or distances."
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        {activity?.status === "declined" && (
          <p className={s.formTip}>
            Saving changes returns this session to self-reported. You can send a
            new verification request.
          </p>
        )}
        <div className={s.formFooter}>
          <button
            className={s.secondary}
            type="button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={s.primary} disabled={busy}>
            {busy ? "Saving…" : "Save session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function TrainingAction({
  action,
  options,
  close,
  saved,
  saveRequest = training,
  childName,
}: {
  action: Action;
  options: TrainingOptions;
  close: () => void;
  saved: (rows: TrainingActivity[]) => void;
  saveRequest?: typeof training;
  childName?: string;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const isRequest = action.kind === "request";
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      saved(
        await saveRequest<TrainingActivity[]>(
          "/" +
            action.activity.id +
            (action.kind === "delete" ? "" : "/request"),
          isRequest ? "POST" : "DELETE",
          isRequest
            ? { coach_id: f.get("coach_id"), note: f.get("note") }
            : undefined,
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
      title={
        isRequest
          ? "Request coach verification"
          : action.kind === "delete"
            ? "Delete this session?"
            : "Withdraw verification request?"
      }
      description={[childName, action.activity.title]
        .filter(Boolean)
        .join(" · ")}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        {isRequest ? (
          options.coaches.length ? (
            <>
              <label>
                Coach
                <select
                  required
                  name="coach_id"
                  disabled={busy}
                  defaultValue={
                    options.coaches.length === 1 ? options.coaches[0].id : ""
                  }
                >
                  <option value="">Choose your coach</option>
                  {options.coaches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.teams}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Note to coach (optional)
                <textarea
                  name="note"
                  maxLength={1000}
                  rows={3}
                  disabled={busy}
                  placeholder="Give your coach any context they need to confirm the session."
                />
              </label>
              <p className={s.formTip}>
                Your coach receives an in-app request with this session’s
                details. Only request confirmation from a coach who can verify
                the work.
              </p>
            </>
          ) : (
            <p className={s.formTip}>
              {childName
                ? "No linked coach yet. Share your child’s coach code from My children so their coach can link them to a team."
                : "No linked coach yet. Ask your coach to add you to an active team roster and link the email you used to register."}{" "}
              You can keep logging sessions meanwhile.
            </p>
          )
        ) : (
          <p>
            {action.kind === "delete"
              ? "This removes the training log permanently."
              : "Your coach will no longer see this pending request. You can edit the session and request verification again."}
          </p>
        )}
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        <div className={s.formFooter}>
          <button
            className={s.secondary}
            type="button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button
            className={s.primary}
            disabled={busy || (isRequest && !options.coaches.length)}
          >
            {busy
              ? "Working…"
              : isRequest
                ? "Send request"
                : action.kind === "delete"
                  ? "Delete session"
                  : "Withdraw request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
