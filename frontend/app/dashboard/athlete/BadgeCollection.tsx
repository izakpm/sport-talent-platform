"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../../lib/api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "./badges.module.css";
type Badge = {
  id: string;
  kind: "training" | "provincial" | "captain";
  title: string;
  earned: boolean;
  hours?: number;
  achieved_at?: string | null;
  achievement?: string;
  organisation?: string;
  organisation_id?: string;
  awards?: Badge[];
  logo_url?: string | null;
  season?: string;
  coach_name?: string;
  verified_at?: string;
  verification_status?: string;
};
type Data = {
  training: {
    year?: number;
    awards?: Badge[];
    verified_minutes: number;
    next_hours: number | null;
    remaining_minutes: number;
    milestones: Badge[];
  };
  sporting: Badge[];
};
const duration = (minutes: number) =>
  `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;
const date = (value: string) =>
  new Date(
    value.length === 10 ? value + "T12:00:00+02:00" : value,
  ).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
function Emblem({ badge }: { badge: Badge }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={s.emblem}
      data-kind={badge.kind}
      data-hours={badge.hours}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 112" fill="none">
        <path
          d="M50 4 92 19v36c0 24-20 43-42 53C28 98 8 79 8 55V19Z"
          fill="#0b2130"
          stroke="var(--badge-metal)"
          strokeWidth="4"
        />
        <path
          d="m50 12 34 13v30c0 19-15 35-34 44-19-9-34-25-34-44V25Z"
          stroke="var(--badge-metal)"
          strokeOpacity=".45"
        />
        <path d="m41 87 9 4 9-4" stroke="var(--badge-metal)" strokeWidth="3" />
      </svg>
      <span className={s.emblemContent}>
        {badge.kind === "provincial" && badge.logo_url && !failed ? (
          <img src={badge.logo_url} alt="" onError={() => setFailed(true)} />
        ) : badge.kind === "captain" ? (
          <>
            <b>C</b>
            <small>CAPTAIN</small>
          </>
        ) : badge.kind === "training" ? (
          <>
            <b>{badge.hours}</b>
            <small>HOURS</small>
          </>
        ) : (
          <>
            <b>★</b>
            <small>SELECTED</small>
          </>
        )}
      </span>
    </span>
  );
}
export default function BadgeCollection({
  compact = false,
  refreshKey,
}: {
  compact?: boolean;
  refreshKey?: unknown;
}) {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [selected, setSelected] = useState<Badge | null>(null);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetchWithAuth("/athlete-profile/badges");
        if (!r?.ok) throw Error("Your badges could not be loaded.");
        const value = await r.json();
        if (!value?.training || !Array.isArray(value.sporting))
          throw Error("Your badges could not be loaded.");
        if (active) {
          setData(value);
          setError("");
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    load();
    const timer = setInterval(load, 60000);
    window.addEventListener("attendance-updated", load);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("attendance-updated", load);
    };
  }, [retry, refreshKey]);
  const all = data
    ? [
        ...data.sporting,
        ...(data.training.awards ||
          data.training.milestones.filter((b) => b.earned)),
      ]
    : [];
  const earned = all.filter((b) => b.earned);
  const grouped = new Map<string, Badge>();
  for (const badge of [
    ...earned.filter((b) => b.kind !== "training"),
    ...earned
      .filter((b) => b.kind === "training")
      .sort((a, b) => (b.hours || 0) - (a.hours || 0)),
  ]) {
    const key =
      badge.kind === "training"
        ? "training-" + badge.hours
        : badge.kind === "captain"
          ? "captain"
          : "provincial-" +
            (badge.organisation_id ||
              badge.organisation?.trim().toLowerCase() ||
              badge.id);
    const group = grouped.get(key);
    if (group) group.awards!.push(badge);
    else grouped.set(key, { ...badge, id: key, awards: [badge] });
  }
  const next = data?.training.milestones.find((b) => !b.earned);
  const shown = compact
    ? [...grouped.values()]
    : [
        ...grouped.values(),
        ...(data?.sporting.filter((b) => !b.earned) || []),
        ...(data?.training.milestones.filter((b) => !b.earned) || []),
      ];
  return (
    <section
      className={compact ? s.strip : s.collection}
      aria-label="Your badges"
    >
      {!compact && (
        <header className={s.header}>
          <div>
            <p className={s.eyebrow}>EARNED THROUGH EFFORT</p>
            <h2>Your badges</h2>
            <p>
              {data
                ? `${earned.length} earned · Built on verified training and achievements.`
                : "Your commitment, recognised."}
            </p>
          </div>
        </header>
      )}
      {error && (
        <p role="alert" className={s.error}>
          {error}{" "}
          <button onClick={() => setRetry((n) => n + 1)}>Retry badges</button>
        </p>
      )}
      {!data && !error && <p role="status">Loading your badges…</p>}
      {data && (
        <>
          {!compact && (
            <div className={s.progressPanel}>
              <div>
                <span className={s.eyebrow}>
                  VERIFIED TRAINING · {data.training.year || "This year"}
                </span>
                <strong>{duration(data.training.verified_minutes)}</strong>
                <p>
                  {next
                    ? `${duration(data.training.remaining_minutes)} to your ${next.hours}-hour badge`
                    : "All five training milestones earned. Keep building your record."}
                </p>
              </div>
              <div className={s.progressTrack}>
                {next ? (
                  <>
                    <div className={s.progressLabels}>
                      <span>Next: {next.hours}-hour club</span>
                      <span>
                        {Math.floor(
                          (data.training.verified_minutes /
                            (next.hours! * 60)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <progress
                      aria-label={`Progress towards ${next.hours} verified training hours`}
                      value={data.training.verified_minutes}
                      max={next.hours! * 60}
                    />
                  </>
                ) : (
                  <span>250-hour club ✓</span>
                )}
                <small>
                  Calendar-year total (SAST) · Completed, verified training
                  only. Overlapping records count once; matches do not count.
                </small>
              </div>
            </div>
          )}
          <div className={compact ? s.stripBadges : s.grid}>
            {shown.map((b) => (
              <button
                key={b.id}
                className={compact ? s.miniBadge : s.badge}
                aria-label={
                  compact
                    ? `${b.title}${b.organisation ? ` · ${b.organisation}` : ""} · Earned${(b.awards?.length || 0) > 1 ? ` ${b.awards!.length} times` : ""}`
                    : undefined
                }
                title={
                  compact
                    ? `${b.title}${b.organisation ? ` · ${b.organisation}` : ""}`
                    : undefined
                }
                data-earned={b.earned}
                onClick={() => setSelected(b)}
                aria-haspopup="dialog"
              >
                <span className={s.awardEmblem}>
                  <Emblem badge={b} />
                  {(b.awards?.length || 0) > 1 && (
                    <sup
                      className={s.awardCount}
                      aria-label={`${b.awards!.length} awards`}
                    >
                      {b.awards!.length}
                    </sup>
                  )}
                </span>
                {!compact && (
                  <>
                    <strong>{b.title}</strong>
                    {b.kind !== "training" && (
                      <span>
                        {b.awards && b.awards.length > 1
                          ? `${b.awards.length} awards · ${[...new Set(b.awards.map((a) => a.season))].join(", ")}`
                          : `${b.organisation || b.achievement} · ${b.season}`}
                      </span>
                    )}
                    <small>
                      {b.earned
                        ? "Earned"
                        : b.kind === "training"
                          ? "Working towards"
                          : b.verification_status === "pending"
                            ? "Awaiting coach review"
                            : "Needs coach verification"}
                    </small>
                  </>
                )}
              </button>
            ))}
          </div>
          {compact && !shown.length && (
            <Link
              className={s.firstBadge}
              href="/dashboard/profile#achievement"
            >
              Your first badge awaits ↗
            </Link>
          )}
          {!compact && !data.sporting.length && (
            <p className={s.hint}>
              Add a provincial team selection or captaincy under your
              achievements, then request coach verification to earn its badge.
            </p>
          )}
        </>
      )}
      {selected && (
        <Modal
          title={selected.title}
          description={
            selected.earned ? "Earned badge" : "A milestone to work towards"
          }
          close={() => setSelected(null)}
        >
          <div className={s.detail}>
            <Emblem badge={selected} />
            {selected.awards && selected.awards.length > 1 ? (
              <>
                <h3>Earned {selected.awards.length} times</h3>
                <ul className={s.awardHistory}>
                  {selected.awards.map((a) => (
                    <li key={a.id}>
                      <strong>
                        {a.season} · {a.achievement || a.title}
                      </strong>
                      {a.organisation && <span>{a.organisation}</span>}
                      {a.achieved_at && <span>{date(a.achieved_at)}</span>}
                      {a.coach_name && <span>Verified by {a.coach_name}</span>}
                    </li>
                  ))}
                </ul>
                {selected.kind === "training" && (
                  <p>
                    Each award represents {selected.hours} verified training
                    hours in a separate calendar year (SAST).
                  </p>
                )}
              </>
            ) : selected.kind === "training" ? (
              <>
                <h3>{selected.hours} verified training hours</h3>
                <p>
                  Earned through completed training logs and coach-verified team
                  attendance. Matches, future sessions and unverified records do
                  not count. Overlapping records are counted once. Each
                  milestone can be earned once per calendar year (SAST).
                </p>
                <p>
                  Your {data?.training.year || "current year"} verified total:{" "}
                  <strong>
                    {duration(data?.training.verified_minutes || 0)}
                  </strong>
                  .
                </p>
              </>
            ) : (
              <>
                <h3>{selected.achievement}</h3>
                <p>
                  {selected.organisation} · {selected.season}
                </p>
                <p>
                  {selected.kind === "provincial"
                    ? "Recognition of a coach-verified provincial team selection."
                    : "Recognition of a coach-verified captaincy appointment."}
                </p>
                {selected.earned ? (
                  <p>
                    Verified by {selected.coach_name || "your coach"}
                    {selected.verified_at
                      ? ` on ${date(selected.verified_at)}`
                      : ""}
                    .
                  </p>
                ) : (
                  <p>
                    {selected.verification_status === "pending"
                      ? "Your coach is reviewing this achievement."
                      : "Request verification on the achievement card to unlock this badge."}
                  </p>
                )}
              </>
            )}
            {selected.achieved_at && (selected.awards?.length || 0) <= 1 && (
              <p>
                {selected.kind === "captain"
                  ? "Appointed"
                  : selected.kind === "provincial"
                    ? "Selected"
                    : "Milestone reached"}
                : {date(selected.achieved_at)}
              </p>
            )}
            <p className={s.hint}>
              Badges reflect the current verified records and are recalculated
              if those records are corrected.
            </p>
            {compact && (
              <Link href="/dashboard/profile#achievement">
                All badges & progress ↗
              </Link>
            )}
          </div>
        </Modal>
      )}
    </section>
  );
}
