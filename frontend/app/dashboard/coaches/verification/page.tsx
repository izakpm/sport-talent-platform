"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  hub,
  notifyAttendance,
  type HubEvent,
  type HubTeam,
} from "../../team-hub/api";
import TrainingRequests from "../../team-hub/TrainingRequests";
import SessionAttendance from "../../team-hub/SessionAttendance";
import { Modal } from "../CoachWorkspace";
import { useSectionHash } from "../../core/useSectionHash";
import s from "../workspace.module.css";
import h from "../../team-hub/hub.module.css";
import f from "../../athlete/feed/feed.module.css";
import v from "./verification.module.css";
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
const tabs = [
  ["requests", "Attendance requests"],
  ["training", "Training logs"],
  ["registers", "Session registers"],
] as const;
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function Page() {
  const [tab, selectTab] = useSectionHash(
    tabs.map(([id]) => id),
    "requests",
  );
  const [data, setData] = useState<{
    events: HubEvent[];
    teams: HubTeam[];
    pending: Pending[];
  } | null>(null);
  const [trainingCount, setTrainingCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState("");
  const [period, setPeriod] = useState("recent");
  const [selected, setSelected] = useState<HubEvent | null>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const version = ++revision.current;
      try {
        const [events, teams, pending] = await Promise.all([
          hub<HubEvent[]>("/sessions"),
          hub<HubTeam[]>("/teams"),
          hub<Pending[]>("/pending"),
        ]);
        if (active && version === revision.current) {
          setData({ events, teams, pending });
          setError("");
        }
      } catch (e) {
        if (active && version === revision.current)
          setError((e as Error).message);
      }
    };
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("attendance-updated", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("attendance-updated", load);
    };
  }, [retry]);
  async function decide(row: Pending, status: "verified" | "declined") {
    setBusy(true);
    setError("");
    setNotice("");
    revision.current++;
    try {
      await hub(`/sessions/${row.event_id}/players/${row.player_id}`, {
        status,
      });
      revision.current++;
      setData((old) =>
        old
          ? {
              ...old,
              pending: old.pending.filter(
                (p) =>
                  p.event_id !== row.event_id || p.player_id !== row.player_id,
              ),
            }
          : old,
      );
      setNotice(
        `${row.first_name} ${row.last_name}: attendance ${status === "verified" ? "verified" : "request declined"}.`,
      );
      notifyAttendance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const pending =
    data?.pending.filter((p) =>
      `${p.first_name} ${p.last_name} ${p.team_name} ${p.title}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()),
    ) ?? [];
  const now = Date.now();
  const events = (data?.events ?? [])
    .filter(
      (e) =>
        (!team || e.team_id === team) &&
        (period === "all" ||
          (period === "cancelled"
            ? e.cancelled
            : !e.cancelled &&
              (period === "upcoming"
                ? new Date(e.starts_at).getTime() > now
                : new Date(e.starts_at).getTime() <= now))),
    )
    .sort((a, b) =>
      period === "upcoming"
        ? a.starts_at.localeCompare(b.starts_at)
        : b.starts_at.localeCompare(a.starts_at),
    );
  const total =
    data && trainingCount !== null ? data.pending.length + trainingCount : null;
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>COACH VERIFICATION</p>
          <h1>Recognise the work.</h1>
          <p className={s.subtitle}>
            Review athlete requests and keep your team's attendance up to date.
          </p>
        </div>
        <Link href="/dashboard/coaches/schedule" className={s.primary}>
          Open schedule ↗
        </Link>
      </header>
      <section className={f.hero}>
        <div>
          <p className={f.eyebrow}>EVERY SESSION COUNTS</p>
          <h2>
            {total === 0
              ? "Your review queue is clear."
              : "Their effort. Your confirmation."}
          </h2>
          <p>
            Confirm attendance, review logged training or open a session
            register for QR check-in.
          </p>
        </div>
        <div className={f.summary}>
          <strong>{total ?? "—"}</strong>
          <span>requests awaiting review</span>
        </div>
      </section>
      <div className={v.tabs} role="tablist" aria-label="Verification sections">
        {tabs.map(([id, label], index) => (
          <button
            key={id}
            role="tab"
            id={`verification-tab-${id}`}
            aria-controls={`verification-panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => selectTab(id)}
            onKeyDown={(e) => {
              const next =
                e.key === "ArrowRight"
                  ? (index + 1) % 3
                  : e.key === "ArrowLeft"
                    ? (index + 2) % 3
                    : e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 2
                        : -1;
              if (next >= 0) {
                e.preventDefault();
                selectTab(tabs[next][0]);
                document
                  .getElementById(`verification-tab-${tabs[next][0]}`)
                  ?.focus();
              }
            }}
          >
            {label}
            {id === "requests" && data
              ? ` (${data.pending.length})`
              : id === "training" && trainingCount !== null
                ? ` (${trainingCount})`
                : ""}
          </button>
        ))}
      </div>
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
      <section
        hidden={tab !== "requests"}
        role="tabpanel"
        id="verification-panel-requests"
        aria-labelledby="verification-tab-requests"
        tabIndex={0}
      >
        <div className={f.filters}>
          <label>
            Find an attendance request
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Athlete, team or session"
              type="search"
            />
          </label>
          <span className={h.help}>
            Oldest requests first · Updates automatically
          </span>
        </div>
        {!data ? (
          <p role="status">Loading attendance requests…</p>
        ) : !pending.length ? (
          <div className={s.empty}>
            <h2>
              {search
                ? "No matching requests."
                : "No attendance requests waiting."}
            </h2>
            <p>
              {search
                ? "Try another athlete, team or session name."
                : "Athletes' requests will appear here. You can also record attendance in Session registers."}
            </p>
            <button
              className={s.secondary}
              onClick={() => (search ? setSearch("") : selectTab("registers"))}
            >
              {search ? "Clear search" : "Open session registers"}
            </button>
          </div>
        ) : (
          <div className={v.list}>
            {pending.map((p) => (
              <article
                className={h.card}
                key={`${p.event_id}-${p.player_id}`}
                aria-label={`${p.first_name} ${p.last_name} attendance request`}
              >
                <div className={h.row}>
                  <div>
                    <span className={h.badge}>Awaiting review</span>
                    <h2>
                      {p.first_name} {p.last_name}
                    </h2>
                    <p>
                      {p.title} · {dateLabel(p.date)}
                    </p>
                    <p className={h.help}>{p.team_name}</p>
                    {p.note && <p className={v.note}>{p.note}</p>}
                  </div>
                  <div className={h.rowActions}>
                    <button
                      className={s.primary}
                      disabled={busy}
                      onClick={() => decide(p, "verified")}
                    >
                      Verify attendance
                    </button>
                    <button
                      className={s.secondary}
                      disabled={busy}
                      onClick={() => decide(p, "declined")}
                    >
                      Decline request
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section
        hidden={tab !== "training"}
        role="tabpanel"
        id="verification-panel-training"
        aria-labelledby="verification-tab-training"
        tabIndex={0}
      >
        <TrainingRequests onCount={setTrainingCount} />
      </section>
      <section
        hidden={tab !== "registers"}
        role="tabpanel"
        id="verification-panel-registers"
        aria-labelledby="verification-tab-registers"
        tabIndex={0}
      >
        <div className={f.filters}>
          <label>
            Team
            <select value={team} onChange={(e) => setTeam(e.target.value)}>
              <option value="">All teams</option>
              {data?.teams.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sessions
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="recent">Started sessions</option>
              <option value="upcoming">Upcoming sessions</option>
              <option value="cancelled">Cancelled sessions</option>
              <option value="all">All sessions</option>
            </select>
          </label>
        </div>
        <p className={h.help}>
          Past 90 days and the coming month. Open the schedule for older
          sessions.
        </p>
        {!data ? (
          <p role="status">Loading session registers…</p>
        ) : !events.length ? (
          <div className={s.empty}>
            <h2>No sessions in this view.</h2>
            <p>
              Choose another team or session filter, or add a session to your
              schedule.
            </p>
            <Link href="/dashboard/coaches/schedule" className={s.primary}>
              Open schedule
            </Link>
          </div>
        ) : (
          <div className={v.list}>
            {events.map((event) => (
              <article className={h.card} key={event.id}>
                <div className={h.row}>
                  <div>
                    <span className={h.badge}>
                      {event.cancelled
                        ? "Cancelled"
                        : new Date(event.starts_at).getTime() > now
                          ? "Upcoming"
                          : "Ready for attendance"}
                    </span>
                    <h2>{event.title}</h2>
                    <p>
                      {event.team_name} · {dateLabel(event.date)} ·{" "}
                      {event.start_time}–{event.end_time}
                    </p>
                    <p className={h.help}>{event.venue || "Venue not added"}</p>
                  </div>
                  <button
                    className={s.primary}
                    onClick={() => setSelected(event)}
                  >
                    {event.cancelled ? "View register" : "Open register & QR"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selected && (
        <Modal
          title="Session attendance"
          description={`${selected.team_name} · ${dateLabel(selected.date)}`}
          close={() => {
            setSelected(null);
            notifyAttendance();
          }}
        >
          <SessionAttendance sessionId={selected.id} />
        </Modal>
      )}
    </div>
  );
}
