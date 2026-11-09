"use client";

import { useState } from "react";
import styles from "./audience.module.css";

export function AthletePreview() {
  const [view, setView] = useState("profile");
  return (
    <div className={styles.preview}>
      <div className={styles.topline}>
        <span>ATHLETE PROFILE</span>
        <span>Illustrative preview</span>
      </div>
      <div className={styles.identity}>
        <div className={styles.avatar}>TM</div>
        <div>
          <h3>Thabo M.</h3>
          <p>Rugby · Scrum-half</p>
          <span>Sample athlete</span>
        </div>
        <b className={styles.shirt}>09</b>
      </div>
      <div className={styles.tabs} aria-label="Athlete example views">
        <button
          aria-pressed={view === "profile"}
          onClick={() => setView("profile")}
        >
          Sporting profile
        </button>
        <button
          aria-pressed={view === "progress"}
          onClick={() => setView("progress")}
        >
          Performance record
        </button>
      </div>
      <div className={styles.content} aria-live="polite">
        {view === "profile" ? (
          <>
            <p className={styles.caption}>THE PLAYER BEHIND THE NUMBER</p>
            <dl className={styles.details}>
              <div>
                <dt>Sport</dt>
                <dd>Rugby</dd>
              </div>
              <div>
                <dt>Primary position</dt>
                <dd>Scrum-half</dd>
              </div>
              <div>
                <dt>Other position</dt>
                <dd>Fly-half</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Start with your sport and positions. Build your sporting story
              from there.
            </p>
          </>
        ) : (
          <>
            <p className={styles.caption}>PLANNED PERFORMANCE & VERIFICATION</p>
            <div className={styles.result}>
              <div>
                <span>40 m sprint</span>
                <strong>
                  5.4 <small>seconds</small>
                </strong>
              </div>
              <span className={styles.pending}>Awaiting review</span>
            </div>
            <ol className={styles.workflow}>
              <li>
                <b>1</b>Record a performance
              </li>
              <li>
                <b>2</b>Request coach verification
              </li>
              <li>
                <b>3</b>Add it to your sporting record
              </li>
            </ol>
          </>
        )}
      </div>
      <div className={styles.footnote}>
        Sample data. Profile setup is available; performance records and
        verification are in development.
      </div>
    </div>
  );
}

export function OrganisationPreview() {
  const [view, setView] = useState("fixtures");
  const [team, setTeam] = useState("first");
  const first = team === "first";
  return (
    <div className={styles.preview}>
      <div className={styles.topline}>
        <span>SCHOOL & CLUB SPORT</span>
        <span>Concept preview</span>
      </div>
      <div className={styles.orgHeading}>
        <div>
          <p className={styles.caption}>EXAMPLE ORGANISATION</p>
          <h3>Riverside Rugby</h3>
        </div>
        <label>
          <span className={styles.srOnly}>Organisation example team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="first">First XV</option>
            <option value="u16">U16</option>
          </select>
        </label>
      </div>
      <div className={styles.tabs} aria-label="Organisation example views">
        {[
          ["fixtures", "Fixtures"],
          ["coaches", "Coaches"],
          ["log", "Competition log"],
        ].map(([key, name]) => (
          <button
            key={key}
            aria-pressed={view === key}
            onClick={() => setView(key)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className={styles.content} aria-live="polite">
        {view === "fixtures" && (
          <>
            <p className={styles.caption}>
              NEXT FIXTURE · {first ? "FIRST XV" : "U16"}
            </p>
            <div className={styles.fixture}>
              <span>
                SAT <b>{first ? "14" : "21"}</b>NOV
              </span>
              <div>
                <h4>Riverside vs {first ? "Hillcrest" : "Northside"}</h4>
                <p>
                  {first
                    ? "10:00 · Riverside main field"
                    : "09:00 · Northside sports ground"}
                </p>
                <strong>{first ? "Home fixture" : "Away fixture"}</strong>
              </div>
            </div>
            <p className={styles.note}>
              Keep the opponent, venue and start time with the right team.
            </p>
          </>
        )}
        {view === "coaches" && (
          <>
            <p className={styles.caption}>TEAM RESPONSIBILITIES</p>
            <div className={styles.coach}>
              <span>{first ? "JM" : "LN"}</span>
              <div>
                <h4>{first ? "Jamie M." : "Lebo N."}</h4>
                <p>Head coach · {first ? "First XV" : "U16"}</p>
              </div>
            </div>
            <div className={styles.coach}>
              <span>AD</span>
              <div>
                <h4>Alex D.</h4>
                <p>Strength & conditioning</p>
              </div>
            </div>
          </>
        )}
        {view === "log" && (
          <>
            <p className={styles.caption}>
              {first ? "FIRST XV" : "U16"} · EXAMPLE COMPETITION
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Team</th>
                  <th scope="col">Played</th>
                  <th scope="col">Won</th>
                  <th scope="col">Points</th>
                </tr>
              </thead>
              <tbody>
                {(first
                  ? [
                      ["Hillcrest", "5", "4", "20"],
                      ["Riverside", "5", "3", "15"],
                      ["Northside", "5", "2", "10"],
                    ]
                  : [
                      ["Riverside", "4", "3", "15"],
                      ["Northside", "4", "2", "10"],
                      ["Hillcrest", "4", "1", "5"],
                    ]
                ).map((row) => (
                  <tr
                    key={row[0]}
                    className={
                      row[0] === "Riverside" ? styles.highlight : undefined
                    }
                  >
                    <th scope="row">{row[0]}</th>
                    {row.slice(1).map((cell, index) => (
                      <td key={index}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
      <div className={styles.footnote}>
        Interactive example with fictional records. Organisation tools are in
        development.
      </div>
    </div>
  );
}
