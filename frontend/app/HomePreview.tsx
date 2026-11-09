"use client";
import { useState } from "react";
import styles from "./landing.module.css";

export default function HomePreview() {
  const [view, setView] = useState("schedule");
  const [team, setTeam] = useState("first");
  const first = team === "first";
  return (
    <div className={styles.preview}>
      <div className={styles.previewTop}>
        <span>
          <img src="/brand-icon.svg" alt="" width="24" height="24" /> COACH
          WORKSPACE
        </span>
        <span className={styles.example}>Interactive example</span>
      </div>
      <div className={styles.previewHeading}>
        <div>
          <span className={styles.smallLabel}>YOUR TEAM, YOUR PLAN</span>
          <h2>{first ? "First XV" : "U16 squad"}</h2>
        </div>
        <label className={styles.previewSelect}>
          <span className={styles.srOnly}>Preview team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="first">First XV · U18</option>
            <option value="u16">U16 squad</option>
          </select>
        </label>
      </div>
      <div className={styles.previewTabs}>
        <button
          aria-pressed={view === "schedule"}
          onClick={() => setView("schedule")}
        >
          Monthly plan
        </button>
        <button
          aria-pressed={view === "roster"}
          onClick={() => setView("roster")}
        >
          Team roster
        </button>
      </div>
      <div className={styles.previewBody} aria-live="polite">
        {view === "schedule" ? (
          <>
            <div className={styles.previewMonth}>
              <strong>November · Training week</strong>
              <span>SAST</span>
            </div>
            {(first
              ? [
                  {
                    day: "09",
                    week: "MON",
                    type: "PRACTICE",
                    title: "Build the defensive line",
                    time: "16:00 – 17:30",
                    place: "Main field",
                    color: "#32704c",
                  },
                  {
                    day: "11",
                    week: "WED",
                    type: "GYM",
                    title: "Strength & conditioning",
                    time: "15:30 – 16:30",
                    place: "School gym",
                    color: "#8565ad",
                  },
                  {
                    day: "14",
                    week: "SAT",
                    type: "MATCH",
                    title: "First XV vs. visitors",
                    time: "10:00 – 12:00",
                    place: "Home ground",
                    color: "#ac7135",
                  },
                ]
              : [
                  {
                    day: "10",
                    week: "TUE",
                    type: "PRACTICE",
                    title: "Passing under pressure",
                    time: "15:00 – 16:30",
                    place: "Training field",
                    color: "#32704c",
                  },
                  {
                    day: "12",
                    week: "THU",
                    type: "VIDEO",
                    title: "Review. Learn. Go again.",
                    time: "15:00 – 15:45",
                    place: "Team room",
                    color: "#4775a2",
                  },
                  {
                    day: "14",
                    week: "SAT",
                    type: "FITNESS TEST",
                    title: "Set a starting point",
                    time: "08:00 – 09:00",
                    place: "Athletics track",
                    color: "#ac526f",
                  },
                ]
            ).map((s) => (
              <div className={styles.previewSession} key={s.day}>
                <div className={styles.previewDate}>
                  <b>{s.day}</b>
                  <span>{s.week}</span>
                </div>
                <div
                  className={styles.sessionInfo}
                  style={{ borderLeftColor: s.color }}
                >
                  <span style={{ color: s.color }}>{s.type}</span>
                  <strong>{s.title}</strong>
                  <small>
                    {s.time} · {s.place}
                  </small>
                </div>
              </div>
            ))}
            <div className={styles.previewNote}>
              <span>↻</span> Set a weekly rhythm. Repeat it through the month.
            </div>
          </>
        ) : (
          <>
            <div className={styles.previewMonth}>
              <strong>A place for every player</strong>
              <span>Sample roster</span>
            </div>
            {(first
              ? [
                  ["6", "Alex M.", "Flanker", "Captain"],
                  ["9", "Sam D.", "Scrum-half", ""],
                  ["15", "Jamie K.", "Full-back", ""],
                ]
              : [
                  ["2", "Robin S.", "Hooker", ""],
                  ["10", "Chris L.", "Fly-half", "Captain"],
                  ["12", "Taylor N.", "Centre", ""],
                ]
            ).map(([number, name, position, captain]) => (
              <div className={styles.previewPlayer} key={number}>
                <b>{number}</b>
                <div>
                  <strong>{name}</strong>
                  <span>{position}</span>
                </div>
                {captain && <small>{captain}</small>}
                <span className={styles.playerStatus}>Active</span>
              </div>
            ))}
            <div className={styles.previewNote}>
              <span>✓</span> Names, positions, shirt numbers. All together.
            </div>
          </>
        )}
      </div>
      <div className={styles.previewFoot}>
        Explore the tabs and switch teams. These are sample records.
      </div>
    </div>
  );
}
