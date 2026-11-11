"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  hub,
  attendanceLabel,
  type HubEvent,
  type HubTeam,
} from "../team-hub/api";
import s from "./overview.module.css";
type Post = {
  id: string;
  title: string;
  body: string;
  team_name: string;
  category: string;
  created_at: string;
};
type User = { first_name?: string; last_name?: string; profile_image?: string };
const attendance = "/dashboard/athlete/activities#attendance";
const date = (value: string) =>
  new Date(value).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    timeZone: "Africa/Johannesburg",
  });
const time = (value: string) =>
  new Date(value).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  });
export default function AthleteOverview() {
  const [user, setUser] = useState<User>({});
  const [data, setData] = useState<{
    events: HubEvent[];
    teams: HubTeam[];
    posts: Post[];
  } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    } catch {}
  }, []);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const [events, teams, posts] = await Promise.all([
          hub<HubEvent[]>("/sessions"),
          hub<HubTeam[]>("/teams"),
          hub<Post[]>("/feed"),
        ]);
        if (active) {
          setData({ events, teams, posts });
          setNow(Date.now());
          setError("");
        }
      } catch {
        if (active)
          setError(
            "We couldn’t refresh your team information. Please try again.",
          );
      }
    };
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("attendance-updated", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("attendance-updated", refresh);
    };
  }, [retry]);
  const events = data?.events.filter((e) => !e.cancelled) || [];
  const upcoming = events
    .filter((e) => new Date(e.ends_at).getTime() >= now)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  const past = events.filter((e) => Date.parse(e.ends_at) < now);
  const verified = past.filter((e) => e.attendance_status === "verified");
  const pending = events.filter((e) => e.attendance_status === "pending");
  const next = upcoming[0];
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR SPORT. YOUR STORY.</p>
          <h1>Welcome back{user.first_name ? `, ${user.first_name}` : ""}.</h1>
          <p>Keep showing up. Make every session part of your story.</p>
        </div>
        <Link className={s.outline} href="/dashboard/profile">
          My sporting profile ↗
        </Link>
      </header>
      {error && (
        <div role="alert" className={s.error}>
          {error} {data && "Showing your last loaded information."}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Try again</button>
        </div>
      )}
      <section className={s.hero}>
        <img src="/Athlete.png" alt="Rugby athlete on the field" />
        <div className={s.heroContent}>
          <p className={s.eyebrow}>BUILT THROUGH DEDICATION</p>
          <h2>
            Your next session.
            <br />
            <em>Your next step.</em>
          </h2>
          <p>
            A sporting portfolio starts with the work you put in. Stay connected
            to your team and keep your attendance on record.
          </p>
          <Link className={s.yellow} href={attendance}>
            View my attendance ↗
          </Link>
        </div>
      </section>
      <div className={s.stats} aria-label="Your team summary">
        <Metric
          label="My teams"
          value={data ? data.teams.length : null}
          note="Linked by your coach"
        />
        <Metric
          label="Upcoming sessions"
          value={data ? upcoming.length : null}
          note="Scheduled over the next 31 days"
        />
        <Metric
          label="Recorded attendance"
          value={data ? verified.length : null}
          note="Completed sessions · last 90 days"
        />
        <Metric
          label="Awaiting verification"
          value={data ? pending.length : null}
          note="Requests with your coach"
        />
      </div>
      {!data && !error && <p role="status">Loading your team information…</p>}
      {data && (
        <>
          {!data.teams.length && (
            <section className={s.join}>
              <div>
                <h2>Your team journey starts here.</h2>
                <p>
                  Ask your coach to add you to their roster and link the email
                  you used to register. Your sessions and team messages will
                  then appear here.
                </p>
              </div>
              <Link className={s.outline} href="/dashboard/profile">
                Check my details ↗
              </Link>
            </section>
          )}
          <div className={s.columns}>
            <section className={s.card}>
              <div className={s.sectionTitle}>
                <h2>Up next</h2>
                <Link href={attendance}>All sessions ↗</Link>
              </div>
              {next ? (
                <>
                  <div className={s.next}>
                    <span className={s.tag}>
                      {Date.parse(next.starts_at) <= now
                        ? "HAPPENING NOW"
                        : date(next.starts_at)}
                    </span>
                    <h3>{next.title}</h3>
                    <p>{next.team_name}</p>
                    <strong>
                      {time(next.starts_at)} – {time(next.ends_at)} SAST
                    </strong>
                    <p>{next.venue || "Venue to be confirmed"}</p>
                    <Link className={s.yellow} href={attendance}>
                      Session & attendance ↗
                    </Link>
                  </div>
                  {upcoming.slice(1, 4).map((e) => (
                    <Link className={s.row} key={e.id} href={attendance}>
                      <span className={s.date}>
                        {date(e.starts_at)}
                        <small>{time(e.starts_at)}</small>
                      </span>
                      <span>
                        <strong>{e.title}</strong>
                        <small>{e.team_name}</small>
                      </span>
                      <span aria-hidden="true">↗</span>
                    </Link>
                  ))}
                </>
              ) : (
                <div className={s.empty}>
                  <h3>No upcoming sessions yet</h3>
                  <p>
                    Sessions scheduled by your coach will appear here. Check
                    your team feed for updates.
                  </p>
                  <Link href="/dashboard/athlete/feed">Open team feed ↗</Link>
                </div>
              )}
              <p className={s.footnote}>
                At training? Scan the QR code displayed by your coach with your
                phone camera to check in.
              </p>
            </section>
            <section className={s.card}>
              <div className={s.sectionTitle}>
                <h2>From your team</h2>
                <Link href="/dashboard/athlete/feed">Open feed ↗</Link>
              </div>
              {data.posts.length ? (
                data.posts.slice(0, 3).map((p) => (
                  <article className={s.post} key={p.id}>
                    <div className={s.meta}>
                      <span>{p.team_name}</span>
                      <time dateTime={p.created_at}>{date(p.created_at)}</time>
                    </div>
                    <span className={s.tag}>
                      {p.category === "cancellation"
                        ? "SESSION CANCELLED"
                        : p.category === "reminder"
                          ? "REMINDER"
                          : "TEAM UPDATE"}
                    </span>
                    <h3>{p.title}</h3>
                    <p>{p.body}</p>
                  </article>
                ))
              ) : (
                <div className={s.empty}>
                  <h3>You’re all caught up</h3>
                  <p>
                    Team announcements, kit reminders and session cancellations
                    will appear here.
                  </p>
                </div>
              )}
            </section>
          </div>
          <div className={s.columns}>
            <section className={s.card}>
              <div className={s.sectionTitle}>
                <h2>Your attendance record</h2>
                <Link href={attendance}>View record ↗</Link>
              </div>
              {past.length ? (
                past
                  .sort(
                    (a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at),
                  )
                  .slice(0, 3)
                  .map((e) => (
                    <Link href={attendance} className={s.record} key={e.id}>
                      <div>
                        <strong>{e.title}</strong>
                        <small>
                          {date(e.starts_at)} · {e.team_name}
                        </small>
                      </div>
                      <span className={s.status}>
                        {attendanceLabel(
                          e.attendance_status,
                          e.attendance_method,
                        )}
                      </span>
                    </Link>
                  ))
              ) : (
                <p className={s.empty}>
                  Your completed team sessions will appear here. You can request
                  verification if you missed the QR check-in.
                </p>
              )}
              <p className={s.footnote}>
                QR check-ins and coach-verified attendance are labelled
                separately.
              </p>
            </section>
            <section className={`${s.card} ${s.profile}`}>
              <p className={s.eyebrow}>BUILD YOUR SPORTING PORTFOLIO</p>
              <h2>Let your dedication show.</h2>
              <p>
                Keep your details current, add your sports and record the
                milestones that matter to you.
              </p>
              <div className={s.links}>
                <Link href="/dashboard/profile">
                  Update my profile <span>↗</span>
                </Link>
                <Link href="/dashboard/profile#sports">
                  Manage my sports <span>↗</span>
                </Link>
                <Link href="/dashboard/profile#achievement">
                  My achievements <span>↗</span>
                </Link>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number | null;
  note: string;
}) {
  return (
    <div className={s.metric}>
      <p>{label}</p>
      <strong>{value === null ? "—" : value}</strong>
      <small>{note}</small>
    </div>
  );
}
