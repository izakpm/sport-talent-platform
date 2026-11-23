"use client";
import { useEffect, useState, type FormEvent } from "react";
import { achievementApi } from "./AchievementVerification";
import { notifyAttendance } from "../team-hub/api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import h from "../team-hub/hub.module.css";
type Request = {
  id: string;
  title: string;
  date: string;
  organization: string;
  notes: string;
  athlete_name: string;
  achievement_type: string;
  leadership_role?: string;
  leadership_date?: string;
  request_note: string;
};
const date = (v: string) =>
  new Date(v + "T12:00:00").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function AchievementRequests({
  onCount,
}: {
  onCount: (n: number) => void;
}) {
  const [rows, setRows] = useState<Request[] | null>(null),
    [selected, setSelected] = useState<Request | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const load = () =>
      achievementApi<Request[]>("/review-requests")
        .then((data) => {
          if (active) {
            setRows(data);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [retry]);
  useEffect(() => {
    if (rows) onCount(rows.length);
  }, [rows, onCount]);
  return (
    <section className={h.card}>
      <h2>Achievement requests{rows ? ` (${rows.length})` : ""}</h2>
      <p className={h.help}>
        Confirm selections, captaincy and awards for athletes on your active
        roster.
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {!rows && !error && <p role="status">Loading achievement requests…</p>}
      {rows?.length === 0 && <p>No achievements are waiting for review.</p>}
      {rows?.map((row) => (
        <article className={h.player} key={row.id}>
          <div className={h.row}>
            <div>
              <strong>{row.athlete_name}</strong>
              <p>
                {row.title} · {date(row.date)}
              </p>
              <p>
                {row.organization}
                {row.leadership_role ? ` · ${row.leadership_role}` : ""}
              </p>
            </div>
            <button className={s.primary} onClick={() => setSelected(row)}>
              Review achievement
            </button>
          </div>
        </article>
      ))}
      {selected && (
        <Review
          entry={selected}
          close={() => setSelected(null)}
          saved={(data) => {
            setRows(data);
            setSelected(null);
            setNotice(
              "Review saved. The athlete can see your decision and feedback.",
            );
            notifyAttendance();
          }}
        />
      )}
    </section>
  );
}
function Review({
  entry,
  close,
  saved,
}: {
  entry: Request;
  close: () => void;
  saved: (data: Request[]) => void;
}) {
  const [decision, setDecision] = useState("verified"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      saved(
        await achievementApi<Request[]>(`/entries/${entry.id}/review`, "POST", {
          status: decision,
          note: f.get("note"),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Review achievement"
      description={`${entry.athlete_name} · ${entry.title}`}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <p>
          {entry.organization}
          <br />
          {entry.achievement_type === "team_selection"
            ? "Selected"
            : "Achievement date"}
          : {date(entry.date)}
        </p>
        {entry.leadership_role && (
          <p>
            {entry.leadership_role}:{" "}
            {entry.leadership_date
              ? date(entry.leadership_date)
              : "Appointment date not recorded"}
          </p>
        )}
        {entry.notes && <p style={{ whiteSpace: "pre-wrap" }}>{entry.notes}</p>}
        {entry.request_note && (
          <p style={{ whiteSpace: "pre-wrap" }}>
            <strong>Athlete’s request:</strong> {entry.request_note}
          </p>
        )}
        <label>
          Decision
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            disabled={busy}
          >
            <option value="verified">Verify this achievement</option>
            <option value="declined">Decline / ask for changes</option>
          </select>
        </label>
        <label>
          Feedback {decision === "declined" ? "(required)" : "(optional)"}
          <textarea
            name="note"
            required={decision === "declined"}
            rows={3}
            maxLength={1000}
            disabled={busy}
          />
        </label>
        <p className={s.formTip}>
          Confirm only details you can verify, including any leadership role and
          dates. Verified achievements are locked against edits.
        </p>
        {error && (
          <p role="alert" className={s.formError}>
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
            {busy
              ? "Saving…"
              : decision === "verified"
                ? "Verify achievement"
                : "Send feedback"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
