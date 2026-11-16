"use client";

import Link from "next/link";
import { useState } from "react";
import type { Workspace, Fixture } from "./SchoolWorkspace";
import s from "./schools.module.css";

const dateLabel = (value: string) =>
  new Date(value + "T12:00:00Z").toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function SchoolOverview({ data }: { data: Workspace }) {
  const years = [...new Set(data.teams.map((t) => t.season))].sort(
    (a, b) => b - a,
  );
  const [season, setSeason] = useState(years[0]?.toString() || "");
  const school = data.school!;
  const teams = data.teams.filter(
    (t) => !season || String(t.season) === season,
  );
  const sports = [
    ...new Set(teams.map((t) => t.sport?.trim()).filter(Boolean)),
  ].sort();
  const coaches = data.coaches || [];
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Johannesburg",
  });
  const fixtures = data.fixtures.filter(
    (f) => !season || f.match_date.startsWith(season),
  );
  const upcoming = fixtures
    .filter(
      (f) =>
        f.match_date >= today && f.home_score === null && f.away_score === null,
    )
    .sort((a, b) => a.match_date.localeCompare(b.match_date))
    .slice(0, 3);
  const results = fixtures
    .filter((f) => f.home_score !== null && f.away_score !== null)
    .sort((a, b) => b.match_date.localeCompare(a.match_date))
    .slice(0, 3);
  const match = (f: Fixture) => {
    const home = f.home_school_id === school.id;
    return (
      <li key={f.id} className={s.previewMatch}>
        <div>
          <small>{dateLabel(f.match_date)}</small>
          <strong>
            {home ? f.home_team : f.away_team} vs{" "}
            {home ? f.away_school : f.home_school}
          </strong>
        </div>
        {f.home_score !== null && f.away_score !== null ? (
          <b>
            {home ? f.home_score : f.away_score} –{" "}
            {home ? f.away_score : f.home_score}
          </b>
        ) : (
          <span>Upcoming</span>
        )}
      </li>
    );
  };
  return (
    <div className={s.page}>
      <header className={s.overviewHeader}>
        <div>
          <p className={s.eyebrow}>Your school. Every sport.</p>
          <h1>School dashboard</h1>
          <p className={s.muted}>
            The people, teams and moments that make your school.
          </p>
        </div>
        <label className={s.season}>
          Season
          <select value={season} onChange={(e) => setSeason(e.target.value)}>
            {years.length ? (
              years.map((y) => <option key={y}>{y}</option>)
            ) : (
              <option value="">All seasons</option>
            )}
          </select>
        </label>
      </header>
      <section
        className={`${s.hero} ${s.schoolHero}`}
        aria-label="School overview"
      >
        <div className={s.identity}>
          {school.logo_url ? (
            <img src={school.logo_url} alt={`${school.name} crest`} />
          ) : (
            <span className={s.schoolMonogram} aria-hidden="true">
              {school.name.slice(0, 1)}
            </span>
          )}
          <div>
            <p className={s.kicker}>Our school</p>
            <h2>{school.name}</h2>
            <p>
              {[school.location, school.province].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className={`${s.stats} ${s.schoolStats}`}>
          {[
            ["Coaches", coaches.length, "Linked to your school", "coaches"],
            ["Sports", sports.length, "Represented by your teams", "teams"],
            [
              "Teams",
              teams.length,
              season ? `${season} season` : "Across recorded seasons",
              "teams",
            ],
          ].map(([label, count, note, route]) => (
            <Link key={label} href={`/dashboard/schools/${route}`}>
              <small>{label}</small>
              <strong>{count}</strong>
              <span>{note}</span>
            </Link>
          ))}
        </div>
        <p className={s.note}>
          Your sporting programme on PlayVerified. Counts reflect the people and
          teams currently linked or recorded.
        </p>
      </section>
      <div className={s.overviewGrid}>
        <section className={s.card}>
          <div className={s.sectionHeading}>
            <h2>Sport at {school.name}</h2>
            <Link href="/dashboard/schools/teams">Explore teams ↗</Link>
          </div>
          {sports.length ? (
            sports.map((sport) => (
              <div key={sport} className={s.sportPreview}>
                <div className={s.sportTitle}>
                  <strong>{sport}</strong>
                  <span>
                    {teams.filter((t) => t.sport === sport).length} teams
                  </span>
                </div>
                <div className={s.teamChips}>
                  {teams
                    .filter((t) => t.sport === sport)
                    .map((t) => (
                      <span key={t.id}>{t.name}</span>
                    ))}
                </div>
              </div>
            ))
          ) : (
            <p className={s.muted}>
              Your sports will appear here as teams are added.
            </p>
          )}
        </section>
        <section className={s.card}>
          <div className={s.sectionHeading}>
            <h2>The coaching team</h2>
            <Link href="/dashboard/schools/coaches">View coaches ↗</Link>
          </div>
          {coaches.length ? (
            <ul className={s.previewList}>
              {coaches.slice(0, 4).map((c) => (
                <li className={s.coachPreview} key={c.id}>
                  {c.profile_image ? (
                    <img src={c.profile_image} alt="" />
                  ) : (
                    <span aria-hidden="true">{(c.first_name || "C")[0]}</span>
                  )}
                  <strong>
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      "Coach"}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <div className={s.emptyPreview}>
              <span aria-hidden="true">◇</span>
              <h3>Your coaches belong here.</h3>
              <p className={s.muted}>
                No coaches are linked yet. This space will introduce the people
                guiding your teams.
              </p>
            </div>
          )}
        </section>
        <section className={s.card}>
          <div className={s.sectionHeading}>
            <h2>Coming up</h2>
            <Link href="/dashboard/schools/fixtures">
              View fixtures & results ↗
            </Link>
          </div>
          {upcoming.length ? (
            <ul className={s.previewList}>{upcoming.map(match)}</ul>
          ) : (
            <div className={s.emptyPreview}>
              <span aria-hidden="true">◷</span>
              <h3>A clear view of what’s next.</h3>
              <p className={s.muted}>
                No upcoming fixtures are recorded for {season || "this school"}.
                Scheduled fixtures will appear here across your teams.
              </p>
            </div>
          )}
        </section>
        <section className={s.card}>
          <div className={s.sectionHeading}>
            <h2>Latest results</h2>
            <Link href="/dashboard/schools/logs">Compare team records ↗</Link>
          </div>
          {results.length ? (
            <>
              <ul className={s.previewList}>{results.map(match)}</ul>
              <p className={s.muted}>
                School score first. Open Fixtures for match details and sources.
              </p>
            </>
          ) : (
            <p className={s.muted}>
              Results will appear here once matches have been recorded.
            </p>
          )}
        </section>
      </div>
      {school.is_demo && (
        <p className={s.demo}>
          Demonstration workspace · Not yet claimed by the school. More sports
          and coaches can be included as the school’s programme is brought onto
          PlayVerified.
        </p>
      )}
    </div>
  );
}
