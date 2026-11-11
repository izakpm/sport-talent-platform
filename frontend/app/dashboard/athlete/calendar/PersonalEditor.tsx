"use client";
import { useState, type FormEvent } from "react";
import { hub } from "../../team-hub/api";
import { Modal } from "../../coaches/CoachWorkspace";
import { todayDate } from "../../coaches/planning";
import { KINDS, type CalendarEvent } from "./calendar";
import s from "../../coaches/workspace.module.css";
import c from "./calendar.module.css";
export function PersonalEditor({
  event,
  date: initialDate,
  events,
  close,
  saved,
}: {
  event: CalendarEvent | null;
  date: string;
  events: CalendarEvent[];
  close: () => void;
  saved: (e: CalendarEvent) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [date, setDate] = useState(
      event?.date || (initialDate < todayDate() ? todayDate() : initialDate),
    ),
    [start, setStart] = useState(event?.start_time || ""),
    [end, setEnd] = useState(event?.end_time || "");
  const overlaps = events.filter(
    (e) =>
      !e.cancelled &&
      e.id !== event?.id &&
      start &&
      end &&
      Date.parse(date + "T" + start + ":00+02:00") < Date.parse(e.ends_at) &&
      Date.parse(date + "T" + end + ":00+02:00") > Date.parse(e.starts_at),
  );
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      saved(
        await hub<CalendarEvent>(
          "/personal-sessions" + (event ? "/" + event.id : ""),
          {
            title: f.get("title"),
            kind: f.get("kind"),
            date,
            start_time: start,
            end_time: end,
            venue: f.get("venue"),
            notes: f.get("notes"),
          },
          event ? "PATCH" : "POST",
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
      title={event ? "Edit personal session" : "Plan a personal session"}
      description="Only you can see this plan. Times are South African time (SAST)."
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset disabled={busy} className={c.personalFields}>
          <label>
            Session title
            <input
              name="title"
              required
              maxLength={120}
              placeholder="e.g. Extra kicking practice"
              defaultValue={event?.title || ""}
            />
          </label>
          <label>
            Session type
            <select name="kind" defaultValue={event?.kind || "practice"}>
              {Object.entries(KINDS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              required
              min={todayDate()}
              max="2099-12-31"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className={s.formRow}>
            <label>
              Start time (SAST)
              <input
                type="time"
                required
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              End time (SAST)
              <input
                type="time"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          <label>
            Venue (optional)
            <input
              name="venue"
              maxLength={160}
              defaultValue={event?.venue || ""}
            />
          </label>
          <label>
            Notes (optional)
            <textarea
              name="notes"
              rows={3}
              maxLength={2000}
              defaultValue={event?.notes || ""}
            />
          </label>
        </fieldset>
        {overlaps.length > 0 && (
          <p className={s.formTip}>
            This overlaps with {overlaps.map((e) => e.title).join(", ")}. You
            can still save it if that is intentional.
          </p>
        )}
        <p className={s.formTip}>
          This adds a plan to your calendar. After training, log what you
          completed under Activities.
        </p>
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
            Back
          </button>
          <button className={s.primary} disabled={busy}>
            {busy ? "Saving…" : "Save personal session"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function CancelPersonal({
  event,
  close,
  saved,
}: {
  event: CalendarEvent;
  close: () => void;
  saved: (e: CalendarEvent) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title="Cancel personal session?"
      description={event.title}
      close={() => {
        if (!busy) close();
      }}
    >
      <div className={s.form}>
        <p>
          The session will stay on your calendar marked as cancelled. This does
          not change any team sessions or training logs.
        </p>
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        <div className={s.formFooter}>
          <button className={s.secondary} disabled={busy} onClick={close}>
            Keep session
          </button>
          <button
            className={s.primary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                saved(
                  await hub<CalendarEvent>(
                    "/personal-sessions/" + event.id + "/cancel",
                    {},
                  ),
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Cancelling…" : "Cancel personal session"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
