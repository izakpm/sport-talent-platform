"use client";
import { useEffect, useState } from "react";
import { hub } from "../../team-hub/api";
import { dayLabel, type CalendarEvent } from "./calendar";
import s from "../../coaches/workspace.module.css";
import c from "./calendar.module.css";
export default function SessionInvitations({
  onChanged,
  readOnly = false,
}: {
  onChanged?: () => void;
  readOnly?: boolean;
}) {
  const [rows, setRows] = useState<CalendarEvent[]>([]),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState("");
  useEffect(() => {
    let active = true;
    const load = () =>
      hub<CalendarEvent[]>("/personal-sessions/invitations")
        .then((data) => {
          if (active) {
            setRows(Array.isArray(data) ? data : []);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [retry]);
  async function respond(id: string, status: string) {
    setBusy(id);
    setError("");
    try {
      await hub(`/personal-sessions/${id}/respond`, {
        status,
        invited_at: rows.find((e) => e.id === id)?.invited_at,
      });
      setRetry((n) => n + 1);
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  if (!rows.length && !error) return null;
  return (
    <section className={c.invitations} aria-label="Session invitations">
      <h2>Session invitations</h2>
      <p>Training plans shared by your connections.</p>
      {error && (
        <p role="alert" className={s.error}>
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>
            Retry invitations
          </button>
        </p>
      )}
      {rows.map((e) => (
        <article key={e.id} className={c.invitation}>
          <div>
            <strong>{e.title}</strong>
            <p>Invited by {e.team_name}</p>
            <p>
              {dayLabel(e.date)} · {e.start_time}–{e.end_time} SAST
            </p>
            {e.venue && <p>{e.venue}</p>}
            <span className={c.invitationStatus}>
              {e.cancelled
                ? "Cancelled"
                : e.invitation_status === "accepted"
                  ? "Accepted"
                  : e.invitation_status === "declined"
                    ? "Declined"
                    : "Awaiting your response"}
            </span>
            {e.notes && (
              <details>
                <summary>Session notes</summary>
                <p className={c.notes}>{e.notes}</p>
              </details>
            )}
          </div>
          {!readOnly &&
            !e.cancelled &&
            Date.parse(e.starts_at) > Date.now() && (
              <div className={c.calendarActions}>
                {e.invitation_status !== "accepted" && (
                  <button
                    className={s.primary}
                    disabled={!!busy}
                    onClick={() => respond(e.id, "accepted")}
                  >
                    {busy === e.id ? "Saving…" : "Accept invitation"}
                  </button>
                )}
                {e.invitation_status !== "declined" && (
                  <button
                    className={s.secondary}
                    disabled={!!busy}
                    onClick={() => respond(e.id, "declined")}
                  >
                    {e.invitation_status === "accepted"
                      ? "Can no longer attend"
                      : "Decline"}
                  </button>
                )}
              </div>
            )}
        </article>
      ))}
    </section>
  );
}
