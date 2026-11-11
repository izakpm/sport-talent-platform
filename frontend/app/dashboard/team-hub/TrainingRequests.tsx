"use client";
import { useEffect, useState, type FormEvent } from "react";
import { training, trainingDate, type TrainingActivity } from "./training-api";
import { notifyAttendance } from "./api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import h from "./hub.module.css";
export default function TrainingRequests({
  onCount,
}: {
  onCount?: (count: number) => void;
}) {
  const [rows, setRows] = useState<TrainingActivity[] | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState<TrainingActivity | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const load = () =>
      training<TrainingActivity[]>("/review-requests")
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
    if (rows) onCount?.(rows.length);
  }, [rows, onCount]);
  return (
    <section className={h.card}>
      <h2>Training log requests{rows ? ` (${rows.length})` : ""}</h2>
      <p className={h.help}>
        Review sessions athletes have logged themselves. Team attendance
        requests are in the Attendance requests tab.
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
      {!rows && !error ? (
        <p role="status">Loading training requests…</p>
      ) : rows && !rows.length ? (
        <p className={h.help}>No training logs are waiting for your review.</p>
      ) : (
        rows?.map((row) => (
          <div className={h.player} key={row.id}>
            <div className={h.row}>
              <div>
                <strong>{row.athlete_name}</strong>
                <p>
                  {row.title} · {trainingDate(row.date)} ·{" "}
                  {row.duration_minutes} min
                </p>
                <p>
                  {row.sport} · {row.training_kind}
                </p>
              </div>
              <button className={s.primary} onClick={() => setSelected(row)}>
                Review session
              </button>
            </div>
          </div>
        ))
      )}
      {selected && (
        <Review
          activity={selected}
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
  activity,
  close,
  saved,
}: {
  activity: TrainingActivity;
  close: () => void;
  saved: (v: TrainingActivity[]) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [decision, setDecision] = useState("verified");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      saved(
        await training<TrainingActivity[]>(
          "/" + activity.id + "/review",
          "POST",
          { status: decision, note: f.get("note") },
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
      title="Review training session"
      description={`${activity.athlete_name} · ${activity.title}`}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <p>
          {activity.sport} · {activity.training_kind}
          <br />
          {trainingDate(activity.date)} · {activity.time} SAST ·{" "}
          {activity.duration_minutes} minutes
          {activity.effort ? ` · Effort ${activity.effort}/10` : ""}
          <br />
          {activity.location || "Venue not recorded"}
        </p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {activity.description || "No training notes added."}
        </p>
        {activity.request_note && (
          <p style={{ whiteSpace: "pre-wrap" }}>
            <strong>Athlete’s request:</strong> {activity.request_note}
          </p>
        )}
        <label>
          Decision
          <select
            disabled={busy}
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
          >
            <option value="verified">Confirm this session</option>
            <option value="declined">Decline / ask for changes</option>
          </select>
        </label>
        <label>
          Feedback {decision === "declined" ? "(required)" : "(optional)"}
          <textarea
            name="note"
            required={decision === "declined"}
            disabled={busy}
            maxLength={1000}
            rows={3}
          />
        </label>
        <p className={s.formTip}>
          Confirm only the work you can verify. Confirmed records are locked
          against athlete edits.
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
                ? "Verify session"
                : "Send feedback"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
