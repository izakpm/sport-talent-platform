"use client";
import { useEffect, useState } from "react";
import { hub, attendanceLabel, notifyAttendance, type HubEvent } from "./api";
import s from "../coaches/workspace.module.css";
import h from "./hub.module.css";
type Player = {
  id: string;
  first_name: string;
  last_name: string;
  status?: string;
  method?: string;
  note?: string;
  linked: boolean;
};
export default function SessionAttendance({
  sessionId,
  onCancelled,
}: {
  sessionId: string;
  onCancelled?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState<{
      event: HubEvent;
      players: Player[];
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0),
    [qr, setQr] = useState<{
      qr: string;
      url: string;
      expires_at: string;
    } | null>(null),
    [now, setNow] = useState(Date.now()),
    [cancel, setCancel] = useState(false),
    [reason, setReason] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    const load = () =>
      hub<{ event: HubEvent; players: Player[] }>(`/sessions/${sessionId}`)
        .then((d) => {
          if (active) {
            setData(d);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [sessionId, retry]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function action(path: string, body?: unknown, method?: string) {
    setBusy(true);
    setError("");
    try {
      await hub(path, body, method);
      setRetry((n) => n + 1);
      notifyAttendance();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    setBusy(true);
    setError("");
    try {
      setQr(await hub(`/sessions/${sessionId}/code`, {}));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const expired = !!qr && new Date(qr.expires_at).getTime() <= now;
  const started = !!data && new Date(data.event.starts_at).getTime() <= now;
  const checkInOpen =
    !!data &&
    now >= new Date(data.event.starts_at).getTime() - 30 * 60000 &&
    now <= new Date(data.event.ends_at).getTime() + 60 * 60000;
  const players =
    data?.players.filter(
      (player) =>
        `${player.first_name} ${player.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase().trim()) &&
        (filter === "all" || (player.status || "unrecorded") === filter),
    ) || [];
  return (
    <div>
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
      {!data ? (
        <p role="status">Loading attendance…</p>
      ) : (
        <>
          <div className={h.row}>
            <div>
              <h2>{data.event.title}</h2>
              <p>
                {data.event.team_name} · {data.event.date} ·{" "}
                {data.event.start_time}
              </p>
            </div>
            <span
              className={`${h.badge} ${data.event.cancelled ? h.cancelled : ""}`}
            >
              {data.event.cancelled
                ? "Cancelled"
                : `${data.players.filter((p) => p.status === "verified").length} attended / ${data.players.length} players`}
            </span>
          </div>
          {!data.event.cancelled && (
            <>
              <div className={h.rowActions}>
                <button
                  className={s.primary}
                  disabled={busy || !checkInOpen}
                  onClick={generate}
                >
                  {qr ? "Generate new QR code" : "Show check-in QR code"}
                </button>
                <button
                  className={s.secondary}
                  disabled={busy}
                  onClick={async () => {
                    if (
                      await action(
                        `/sessions/${sessionId}/code`,
                        undefined,
                        "DELETE",
                      )
                    ) {
                      setQr(null);
                      setNotice("QR check-in closed.");
                    }
                  }}
                >
                  Close QR check-in
                </button>
              </div>
              <p className={h.help}>
                Codes last 15 minutes. Check-in opens 30 minutes before the
                session and closes one hour after it ends. Generating a new code
                replaces the previous code.
              </p>
              {qr && (
                <div className={h.qr}>
                  {expired ? (
                    <p role="status">
                      This QR code has expired. Generate a new one if check-in
                      is still open.
                    </p>
                  ) : (
                    <>
                      <img src={qr.qr} alt="Session check-in QR code" />
                      <p>
                        Scan with your phone camera and sign in as an athlete.
                      </p>
                      <p>
                        Expires at{" "}
                        {new Date(qr.expires_at).toLocaleTimeString("en-ZA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <button
                        className={s.secondary}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(qr.url);
                            setNotice("Check-in link copied.");
                          } catch {
                            setError(
                              "Unable to copy the link. Use the QR code instead.",
                            );
                          }
                        }}
                      >
                        Copy check-in link
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          <h3 style={{ marginTop: 24 }}>Attendance register</h3>
          <p className={h.help}>
            QR entries are recorded as check-ins. You can correct attendance
            below. Verification requests need your approval.
          </p>
          {!started && !data.event.cancelled && (
            <p className={h.help}>
              Attendance can be recorded once this session starts.
            </p>
          )}
          <div className={h.filters}>
            <label>
              Find a player
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Player name"
              />
            </label>
            <label>
              Attendance status
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All players</option>
                <option value="pending">Awaiting review</option>
                <option value="unrecorded">Not recorded</option>
                <option value="verified">Attended</option>
                <option value="absent">Absent</option>
                <option value="declined">Declined</option>
              </select>
            </label>
          </div>
          <div className={h.register}>
            {players.map((player) => (
              <div className={h.player} key={player.id}>
                <div className={h.row}>
                  <div>
                    <strong>
                      {player.first_name} {player.last_name}
                    </strong>
                    <span className={h.badge}>
                      {attendanceLabel(player.status, player.method)}
                    </span>
                    {!player.linked && (
                      <small className={h.linkStatus}>
                        {" "}
                        · Account not linked
                      </small>
                    )}
                  </div>
                  {!data.event.cancelled && (
                    <div className={h.rowActions}>
                      <button
                        className={s.secondary}
                        disabled={busy || !started}
                        onClick={() =>
                          action(
                            `/sessions/${sessionId}/players/${player.id}`,
                            { status: "verified" },
                          )
                        }
                      >
                        {player.status === "pending" ? "Approve" : "Attended"}
                      </button>
                      <button
                        className={s.textButton}
                        disabled={busy || !started}
                        onClick={() =>
                          action(
                            `/sessions/${sessionId}/players/${player.id}`,
                            {
                              status:
                                player.status === "pending"
                                  ? "declined"
                                  : "absent",
                            },
                          )
                        }
                      >
                        {player.status === "pending" ? "Decline" : "Absent"}
                      </button>
                    </div>
                  )}
                </div>
                {player.note && <p>{player.note}</p>}
              </div>
            ))}
            {!!data.players.length && !players.length && (
              <p>No players match these filters.</p>
            )}
            {!data.players.length && (
              <p>Add players to the team before recording attendance.</p>
            )}
          </div>
          {!data.event.cancelled && (
            <div className={h.noticeBox}>
              {cancel ? (
                <>
                  <label className={s.form}>
                    Cancellation message
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={1000}
                      placeholder="e.g. Training cancelled due to rain"
                    />
                  </label>
                  <p className={h.help}>
                    This cancels the session, closes check-in and posts a
                    cancellation to the team feed.
                  </p>
                  <div className={h.rowActions}>
                    <button
                      className={s.secondary}
                      disabled={busy}
                      onClick={() => setCancel(false)}
                    >
                      Keep session
                    </button>
                    <button
                      className={s.danger}
                      disabled={busy || !reason.trim()}
                      onClick={async () => {
                        if (
                          await action(`/sessions/${sessionId}/cancel`, {
                            reason,
                          })
                        ) {
                          setQr(null);
                          setCancel(false);
                          onCancelled?.();
                        }
                      }}
                    >
                      Cancel session & notify team
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className={s.textButton}
                  onClick={() => setCancel(true)}
                >
                  Cancel this session and notify the team
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
