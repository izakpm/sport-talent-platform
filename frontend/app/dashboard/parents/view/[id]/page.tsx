"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../../../lib/api";
import { childContext } from "../../../../lib/guardian-context";
import Calendar from "../../../athlete/calendar/AthleteCalendar";
import Matches from "../../../matches/MatchesWorkspace";
import Feed from "../../../athlete/feed/page";
import s from "../../../coaches/workspace.module.css";
import p from "../../parents.module.css";
type Profile = {
  user: { first_name: string; last_name: string };
  details: { bio?: string; province?: string };
  sports: {
    sport_name: string;
    position_name: string;
    primary_position: boolean;
  }[];
  entries: {
    id: string;
    kind: string;
    title: string;
    date: string;
    organization: string;
    notes: string;
    value: number | null;
    unit: string | null;
  }[];
};
export default function ChildProgress() {
  const [tab, setTab] = useState("profile"),
    [data, setData] = useState<Profile | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchWithAuth("/athlete-profile");
        const json = await res?.json();
        if (!res?.ok)
          throw Error(json?.message || "Unable to load this sporting profile.");
        if (active) setData(json);
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const child = childContext();
  return (
    <div
      className={s.workspace}
      onClickCapture={(event) => {
        const link = (event.target as HTMLElement).closest("a");
        const href = link?.getAttribute("href");
        if (
          href?.startsWith("/dashboard/athlete") ||
          href === "/dashboard/profile"
        ) {
          event.preventDefault();
          setTab(
            href.includes("feed")
              ? "feed"
              : href.includes("matches")
                ? "matches"
                : href.includes("calendar")
                  ? "calendar"
                  : "profile",
          );
        }
      }}
    >
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>CONNECTED TO THEIR PROGRESS</p>
          <h1>{child?.first_name}’s sporting journey</h1>
          <p className={s.subtitle}>
            Shared by your athlete. View their progress and plans together.
          </p>
        </div>
      </header>
      <nav className={p.tabs} aria-label="Child information">
        {[
          ["profile", "Profile & achievements"],
          ["calendar", "Calendar"],
          ["matches", "Matches"],
          ["feed", "Team Feed"],
        ].map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? s.primary : s.secondary}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "calendar" ? (
        <Calendar readOnly />
      ) : tab === "matches" ? (
        <Matches readOnly />
      ) : tab === "feed" ? (
        <Feed />
      ) : error ? (
        <p role="alert" className={s.error}>
          {error}
        </p>
      ) : !data ? (
        <p role="status">Loading sporting profile…</p>
      ) : (
        <>
          <section className={p.hero}>
            <span className={p.eyebrow}>Their sporting story</span>
            <h2>
              {data.user.first_name} {data.user.last_name}
            </h2>
            <p>{data.details.province}</p>
            <p>
              {data.details.bio ||
                "Their sporting profile will grow as they add their experiences."}
            </p>
            {data.sports.map((sport, index) => (
              <p key={index}>
                {sport.sport_name} · {sport.position_name}
                {sport.primary_position ? " · Primary position" : ""}
              </p>
            ))}
          </section>
          <div className={p.grid}>
            {[
              ["achievement", "Achievements"],
              ["metric", "Performance metrics"],
            ].map(([kind, label]) => (
              <section key={kind} className={p.card}>
                <h2>{label}</h2>
                {data.entries
                  .filter((e) => e.kind === kind)
                  .map((e) => (
                    <article key={e.id}>
                      <h3>{e.title}</h3>
                      <p>
                        {e.date}
                        {e.organization ? " · " + e.organization : ""}
                      </p>
                      {e.value !== null && (
                        <strong>
                          {e.value} {e.unit}
                        </strong>
                      )}
                      <p>{e.notes}</p>
                    </article>
                  ))}
                {!data.entries.some((e) => e.kind === kind) && (
                  <p>No {label.toLowerCase()} added yet.</p>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
