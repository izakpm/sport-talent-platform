"use client";
import { useEffect, useState } from "react";
import {
  hub,
  type HubEvent,
  type HubTeam,
  attendanceLabel,
  notifyAttendance,
} from "./api";
import SessionAttendance from "./SessionAttendance";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import h from "./hub.module.css";
type Pending = {
  event_id: string;
  player_id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  title: string;
  date: string;
  note: string;
};
export default function AttendancePage({ coach = false }: { coach?: boolean }) {
  const [events, setEvents] = useState<HubEvent[]>([]),
    [teams, setTeams] = useState<HubTeam[]>([]),
    [pending, setPending] = useState<Pending[]>([]),
    [team, setTeam] = useState(""),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<HubEvent | null>(null),
    [requesting, setRequesting] = useState<HubEvent | null>(null),
    [note, setNote] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    setError("");
    const load = () =>
      Promise.all([
        hub<HubEvent[]>("/sessions"),
        hub<HubTeam[]>("/teams"),
        coach ? hub<Pending[]>("/pending") : Promise.resolve([]),
      ])
        .then(([e, t, p]) => {
          if (active) {
            setEvents(e);
            setTeams(t);
            setPending(p);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    load();
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [coach, retry]);
  async function action(path: string, body: unknown) {
    setError("");
    setBusy(true);
    try {
      const result = await hub<{ status: string }>(path, body);
      setRetry((n) => n + 1);
      notifyAttendance();
      return result;
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
          <h1>{coach ? "Verification & attendance" : "My attendance"}</h1>
          <p className={s.subtitle}>
            {coach
              ? "Approve requests, open QR check-in and keep your register up to date."
              : "Check your session attendance and request your coach’s confirmation."}
          </p>
        </div>
      </header>
      {error && (
        <p className={s.error} role="alert">
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      )}
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {coach && (
        <section className={h.card}>
          <h2>Verification requests ({pending.length})</h2>
          {!pending.length ? (
            <p className={h.help}>
              You’re up to date. New athlete requests will appear here.
            </p>
          ) : (
            pending.map((p) => (
              <div className={h.player} key={`${p.event_id}-${p.player_id}`}>
                <div className={h.row}>
                  <div>
                    <strong>
                      {p.first_name} {p.last_name}
                    </strong>
                    <p>
                      {p.title} · {p.team_name} · {p.date}
                    </p>
                    {p.note && <p>{p.note}</p>}
                  </div>
                  <div className={h.rowActions}>
                    <button
                      className={s.primary}
                      disabled={busy}
                      onClick={() =>
                        action(
                          `/sessions/${p.event_id}/players/${p.player_id}`,
                          { status: "verified" },
                        )
                      }
                    >
                      Approve
                    </button>
                    <button
                      className={s.secondary}
                      disabled={busy}
                      onClick={() =>
                        action(
                          `/sessions/${p.event_id}/players/${p.player_id}`,
                          { status: "declined" },
                        )
                      }
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      )}
      <div className={h.filters}>
        <label>
          Team
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="">All teams</option>
            {teams.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <span className={h.help}>
          Past 90 days and the coming month. Older sessions remain accessible
          from the coach’s schedule.
        </span>
      </div>
      {loading ? (
        <p role="status">Loading sessions…</p>
      ) : !events.length ? (
        <section className={s.empty}>
          <h2>No team sessions yet.</h2>
          <p>
            {coach
              ? "Create a team and add sessions to its schedule."
              : "Ask your coach to link your athlete account to your team roster."}
          </p>
        </section>
      ) : (
        <div className={h.stack}>
          {events
            .filter((e) => !team || e.team_id === team)
            .map((event) => (
              <article className={h.card} key={event.id}>
                <div className={h.row}>
                  <div>
                    <div className={h.meta}>
                      <strong>{event.team_name}</strong>
                      <span>
                        {event.date} · {event.start_time}–{event.end_time}
                      </span>
                    </div>
                    <h2>{event.title}</h2>
                    <p>{event.venue}</p>
                    <span
                      className={`${h.badge} ${event.cancelled ? h.cancelled : ""}`}
                    >
                      {event.cancelled
                        ? "Cancelled"
                        : coach
                          ? "Scheduled session"
                          : attendanceLabel(
                              event.attendance_status,
                              event.attendance_method,
                            )}
                    </span>
                  </div>
                  {coach ? (
                    <button
                      className={s.primary}
                      onClick={() => setSelected(event)}
                    >
                      Open attendance
                    </button>
                  ) : (
                    !event.cancelled &&
                    !event.attendance_status && (
                      <button
                        className={s.primary}
                        disabled={
                          new Date(event.starts_at).getTime() > Date.now()
                        }
                        onClick={() => {
                          setRequesting(event);
                          setNote("");
                        }}
                      >
                        Request verification
                      </button>
                    )
                  )}
                </div>
              </article>
            ))}
        </div>
      )}
      {selected && (
        <Modal
          title="Session attendance"
          description="Manage the attendance record for this session."
          close={() => {
            setSelected(null);
            setRetry((n) => n + 1);
            notifyAttendance();
          }}
        >
          <SessionAttendance sessionId={selected.id} />
        </Modal>
      )}
      {requesting && (
        <Modal
          title="Request attendance verification"
          description={`${requesting.title} · ${requesting.date}`}
          close={() => !busy && setRequesting(null)}
        >
          <div className={s.form}>
            <label>
              Note to your coach (optional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
              />
            </label>
            <p>
              Your coach will be asked to confirm that you attended this
              session.
            </p>
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <div className={s.formFooter}>
              <button
                className={s.secondary}
                disabled={busy}
                onClick={() => setRequesting(null)}
              >
                Cancel
              </button>
              <button
                className={s.primary}
                disabled={busy}
                onClick={async () => {
                  const result = await action(
                    `/sessions/${requesting.id}/request`,
                    { note },
                  );
                  if (result) {
                    setRequesting(null);
                    setNotice(
                      result.status === "pending"
                        ? "Verification request sent to your coach."
                        : attendanceLabel(result.status),
                    );
                  }
                }}
              >
                {busy ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
