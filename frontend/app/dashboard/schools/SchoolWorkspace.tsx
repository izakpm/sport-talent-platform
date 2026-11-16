"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../../lib/api";
import s from "./schools.module.css";
import SchoolOverview from "./SchoolOverview";

type Team = { id: string; name: string; season: number; sport: string };
export type Fixture = {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team: string;
  away_team: string;
  home_school_id: string;
  away_school_id: string;
  home_school: string;
  away_school: string;
  home_score: number | null;
  away_score: number | null;
  division: string;
  competition?: string;
  venue: string | null;
  round: string | null;
  decision_note: string | null;
  source_url: string;
  source_label: string;
  additional_sources: { label: string; url: string }[];
};
export type Workspace = {
  school: {
    id: string;
    name: string;
    location: string;
    province: string;
    division: string;
    logo_url: string | null;
    is_demo: boolean;
    source_url: string;
    type?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    description?: string;
    can_edit_profile?: boolean;
  } | null;
  teams: Team[];
  fixtures: Fixture[];
  coaches?: {
    id: string;
    first_name: string;
    last_name: string;
    profile_image: string | null;
  }[];
};
export const divisionName: Record<string, string> = {
  beker: "Cup",
  plaat: "Plate",
  skild: "Shield",
  "bowl-oos": "Bowl East",
  "bowl-wes": "Bowl West",
};
export function isPastFixture(f: Fixture, today: string) {
  return (
    (f.home_score !== null && f.away_score !== null) || f.match_date < today
  );
}
export function resultTotals(fixtures: Fixture[], schoolId: string) {
  const recorded = fixtures.filter(
    (f) => f.home_score !== null && f.away_score !== null,
  );
  let wins = 0,
    draws = 0,
    losses = 0,
    scored = 0,
    conceded = 0;
  for (const f of recorded) {
    const home = f.home_school_id === schoolId;
    const a = (home ? f.home_score : f.away_score)!;
    const b = (home ? f.away_score : f.home_score)!;
    scored += a;
    conceded += b;
    if (a > b) wins++;
    else if (a < b) losses++;
    else draws++;
  }
  return { recorded: recorded.length, wins, draws, losses, scored, conceded };
}
export default function SchoolWorkspace({
  view = "overview",
}: {
  view?:
    | "overview"
    | "teams"
    | "fixtures"
    | "logs"
    | "coaches"
    | "achievements";
}) {
  const [data, setData] = useState<Workspace | null>(null),
    [error, setError] = useState(""),
    [year, setYear] = useState("2026"),
    [team, setTeam] = useState(""),
    [query, setQuery] = useState(""),
    [sport, setSport] = useState(""),
    [competition, setCompetition] = useState(""),
    [limit, setLimit] = useState(30);
  useEffect(() => {
    let active = true;
    fetchWithAuth("/schools/workspace")
      .then(async (r) => {
        if (!r?.ok) throw Error("Could not load the school workspace.");
        const d = await r.json();
        if (active) {
          setData(d);
          const params = new URLSearchParams(window.location.search);
          const requestedYear = params.get("year");
          setYear(
            requestedYear &&
              d.teams.some((t: Team) => String(t.season) === requestedYear)
              ? requestedYear
              : String(
                  Math.max(...d.teams.map((t: Team) => t.season), 0) || "",
                ),
          );
          const requestedTeam = params.get("team");
          if (
            requestedTeam &&
            d.teams.some((t: Team) => t.id === requestedTeam)
          )
            setTeam(requestedTeam);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const title = {
    overview: "School dashboard",
    teams: "Teams",
    fixtures: "Fixtures",
    logs: "Log",
    coaches: "Coaches",
    achievements: "Achievements",
  }[view];
  if (error)
    return (
      <div className={s.page}>
        <h1>{title}</h1>
        <p role="alert">{error} Please refresh to try again.</p>
      </div>
    );
  if (!data)
    return (
      <div className={s.page}>
        <h1>{title}</h1>
        <p role="status">Loading your school…</p>
      </div>
    );
  if (!data.school)
    return (
      <div className={s.page}>
        <h1>{title}</h1>
        <div className={s.card}>
          Your school has not been connected to this account yet.
        </div>
      </div>
    );
  const school = data.school;
  if (view === "overview") return <SchoolOverview data={data} />;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const sportTeams = new Set(
    data.teams.filter((t) => !sport || t.sport === sport).map((t) => t.id),
  );
  const fixtures = data.fixtures
    .filter(
      (f) =>
        (!year || f.match_date.startsWith(year)) &&
        (!team || f.home_team_id === team || f.away_team_id === team) &&
        (sportTeams.has(f.home_team_id) || sportTeams.has(f.away_team_id)) &&
        (!competition || f.competition === competition) &&
        (view === "fixtures"
          ? !isPastFixture(f, today)
          : isPastFixture(f, today)) &&
        (!query ||
          `${f.home_school} ${f.away_school} ${f.home_team} ${f.away_team}`
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) =>
      view === "fixtures"
        ? a.match_date.localeCompare(b.match_date)
        : b.match_date.localeCompare(a.match_date),
    );
  const teams = data.teams.filter(
    (t) =>
      (!year || String(t.season) === year) &&
      (!team || t.id === team) &&
      (!sport || t.sport === sport) &&
      (view !== "teams" ||
        !query ||
        `${t.name} ${t.sport}`.toLowerCase().includes(query.toLowerCase())),
  );
  const totals = resultTotals(fixtures, school.id);
  const years = [...new Set(data.teams.map((t) => String(t.season)))]
    .sort()
    .reverse();
  const filters = (
    <div className={s.filters}>
      <label>
        Year
        <select
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setTeam("");
            setLimit(30);
          }}
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </label>
      <label>
        Sport
        <select
          value={sport}
          onChange={(e) => {
            setSport(e.target.value);
            setTeam("");
            setLimit(30);
          }}
        >
          <option value="">All sports</option>
          {[...new Set(data.teams.map((t) => t.sport).filter(Boolean))]
            .sort()
            .map((x) => (
              <option key={x}>{x}</option>
            ))}
        </select>
      </label>
      <label>
        Team
        <select
          value={team}
          onChange={(e) => {
            setTeam(e.target.value);
            setLimit(30);
          }}
        >
          <option value="">All teams</option>
          {data.teams
            .filter(
              (t) =>
                (!year || String(t.season) === year) &&
                (!sport || t.sport === sport),
            )
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
        </select>
      </label>
      {view !== "teams" && (
        <label>
          Competition
          <select
            value={competition}
            onChange={(e) => {
              setCompetition(e.target.value);
              setLimit(30);
            }}
          >
            <option value="">All competitions</option>
            {[
              ...new Set(
                data.fixtures.map((f) => f.competition).filter(Boolean),
              ),
            ]
              .sort()
              .map((x) => (
                <option key={x}>{x}</option>
              ))}
          </select>
        </label>
      )}
      <label className={s.search}>
        Search
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(30);
          }}
          placeholder={
            view === "teams"
              ? "Search team or sport"
              : "Search opponent or team"
          }
        />
      </label>
    </div>
  );
  const summary = (
    <section className={s.hero} aria-label="School season summary">
      <div className={s.identity}>
        {school.logo_url && (
          <img src={school.logo_url} alt={`${school.name} crest`} />
        )}
        <div>
          <p className={s.kicker}>
            {school.type === "CLUB" ? "Sporting club" : "School sport"}
          </p>
          <h2>{school.name}</h2>
          <p>
            {[school.location, school.province].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <div className={s.stats}>
        {(view === "logs"
          ? [
              ["Teams", teams.length],
              ["Recorded results", totals.recorded],
              [
                "Wins / Draws / Losses",
                `${totals.wins} / ${totals.draws} / ${totals.losses}`,
              ],
              ["Points for / against", `${totals.scored} / ${totals.conceded}`],
            ]
          : view === "fixtures"
            ? [
                ["Upcoming fixtures", fixtures.length],
                [
                  "Teams",
                  new Set(
                    fixtures.map((f) =>
                      f.home_school_id === school.id
                        ? f.home_team_id
                        : f.away_team_id,
                    ),
                  ).size,
                ],
              ]
            : [
                ["Coaches", data.coaches?.length || 0],
                [
                  "Sports",
                  new Set(teams.map((t) => t.sport).filter(Boolean)).size,
                ],
                ["Teams", teams.length],
              ]
        ).map(([label, value]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <p className={s.note}>
        {view === "logs"
          ? "Recorded scores only. This is your team record, not an official tournament standings table."
          : view === "fixtures"
            ? "Upcoming matches across your teams. Past matches and results are in Log."
            : "The people and teams currently recorded for your organisation."}
      </p>
    </section>
  );
  return (
    <div className={s.page}>
      <header>
        <p className={s.eyebrow}>Your school. Every team.</p>
        <h1>{title}</h1>
        <p className={s.muted}>
          {view === "teams"
            ? "Your teams, sports and age groups."
            : view === "fixtures"
              ? "See where and when your teams play next."
              : view === "logs"
                ? "Past matches, results and team records in one place."
                : "The people and progress behind your organisation."}
        </p>
      </header>
      {school.is_demo && (
        <p className={s.demo}>
          Demonstration workspace · Public competition data · Not yet claimed by
          the school
        </p>
      )}
      {!["coaches", "achievements"].includes(view) && filters}
      {summary}
      {view === "teams" && (
        <section>
          <h2>Team directory</h2>
          <p className={s.muted}>
            Choose a team to view its upcoming fixtures or its match log.
          </p>
          <div className={s.grid}>
            {teams.map((t) => {
              return (
                <article className={s.card} key={t.id}>
                  <p className={s.eyebrow}>
                    {t.season} · {t.sport}
                  </p>
                  <h3>{t.name}</h3>
                  <p className={s.muted}>
                    Roster and coach assignments have not been recorded for this
                    team.
                  </p>
                  <div className={s.links}>
                    <Link
                      href={`/dashboard/schools/fixtures?team=${t.id}&year=${t.season}`}
                    >
                      Fixtures ↗
                    </Link>
                    <Link
                      href={`/dashboard/schools/logs?team=${t.id}&year=${t.season}`}
                    >
                      Log ↗
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          {!teams.length && (
            <p className={s.card}>No teams match these filters.</p>
          )}
        </section>
      )}
      {view === "logs" && (
        <section className={s.card}>
          <h2>Team records</h2>
          <div className={s.tableWrap}>
            <table className={s.logTable}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Sport</th>
                  <th>Played</th>
                  <th>W</th>
                  <th>D</th>
                  <th>L</th>
                  <th>For</th>
                  <th>Against</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                  const r = resultTotals(
                    fixtures.filter(
                      (f) => f.home_team_id === t.id || f.away_team_id === t.id,
                    ),
                    school.id,
                  );
                  return (
                    <tr key={t.id}>
                      <th scope="row">{t.name}</th>
                      <td>{t.sport}</td>
                      <td>{r.recorded}</td>
                      <td>{r.wins}</td>
                      <td>{r.draws}</td>
                      <td>{r.losses}</td>
                      <td>{r.scored}</td>
                      <td>{r.conceded}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className={s.muted}>
            Only matches with recorded scores count as played. Missing or
            disputed scores remain in the match history below.
          </p>
        </section>
      )}
      {["fixtures", "logs"].includes(view) && (
        <section>
          <h2>
            {view === "fixtures" ? "Upcoming fixtures" : "Match history"}{" "}
            <small className={s.count}>{fixtures.length} fixtures</small>
          </h2>
          <div className={s.list}>
            {fixtures.slice(0, limit).map((f) => {
              const home = f.home_school_id === school.id;
              const own = home ? f.home_score : f.away_score,
                opp = home ? f.away_score : f.home_score;
              return (
                <details className={s.fixture} key={f.id}>
                  <summary>
                    <time dateTime={f.match_date}>
                      {new Date(f.match_date + "T12:00:00Z").toLocaleDateString(
                        "en-ZA",
                        { day: "numeric", month: "short", year: "numeric" },
                      )}
                    </time>
                    <div>
                      <strong>
                        {home ? f.home_team : f.away_team} vs{" "}
                        {home ? f.away_school : f.home_school}
                      </strong>
                      <small>
                        {divisionName[f.division] || f.division} ·{" "}
                        {home ? "Listed home" : "Listed away"}
                      </small>
                    </div>
                    <b
                      className={
                        view === "fixtures" || own === null || opp === null
                          ? s.pendingScore
                          : s.score
                      }
                    >
                      {view === "fixtures"
                        ? "Upcoming"
                        : own === null || opp === null
                          ? "Awaiting result"
                          : `${own} – ${opp}`}
                    </b>
                    <span aria-hidden="true">⌄</span>
                  </summary>
                  <div className={s.details}>
                    <p>
                      {f.competition === "Virseker Noordvaal Cup" && (
                        <img
                          src="/competitions/virseker-noordvaal.png"
                          alt="Virseker Noordvaal Cup"
                          width="40"
                        />
                      )}{" "}
                      {f.competition || "Competition not specified"} ·{" "}
                      {f.round || "Published fixture"}
                    </p>
                    <p>
                      {f.venue || "Venue not supplied"} · Kick-off time not
                      supplied
                    </p>
                    {f.decision_note && <p>{f.decision_note}</p>}
                    {view === "logs" && (
                      <p>
                        Scores show {school.name} first. These records do not
                        confirm individual player appearances.
                      </p>
                    )}
                    <a href={f.source_url} target="_blank" rel="noreferrer">
                      Source: {f.source_label} ↗
                    </a>
                    {f.additional_sources.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer">
                        Also reported by {a.label} ↗
                      </a>
                    ))}
                  </div>
                </details>
              );
            })}
            {!fixtures.length && (
              <p className={s.card}>
                {view === "fixtures"
                  ? "No upcoming fixtures match these filters. Past matches are available in Log."
                  : "No published fixtures match these filters."}
              </p>
            )}
          </div>
          {fixtures.length > limit && (
            <button className={s.more} onClick={() => setLimit(limit + 30)}>
              Show more matches
            </button>
          )}
        </section>
      )}
      {view === "coaches" && (
        <section className={s.card}>
          <h2>No coaches linked yet</h2>
          <p>
            Public results do not establish who currently coaches each team.
            Coach assignments will appear here once confirmed by the school.
          </p>
        </section>
      )}
      {view === "achievements" && (
        <section className={s.card}>
          <h2>No school-confirmed achievements yet</h2>
          <p>
            Explore the published match results and season records. Competition
            titles are not inferred from a score alone.
          </p>
          <Link href="/dashboard/schools/logs">View results ↗</Link>
        </section>
      )}
      <p className={s.muted}>
        School directory:{" "}
        <a href={school.source_url} target="_blank" rel="noreferrer">
          Directory source ↗
        </a>
      </p>
    </div>
  );
}
