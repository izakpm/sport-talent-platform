"use client";
import { useState } from "react";
import s from "./parent-preview.module.css";
const sessions = [
  {
    child: "Alex",
    day: "TUE",
    time: "16:00",
    title: "Rugby practice",
    detail: "U13 · School field",
    kind: "Training",
  },
  {
    child: "Jamie",
    day: "THU",
    time: "15:30",
    title: "Strength & conditioning",
    detail: "U16 · Club gym",
    kind: "Training",
  },
  {
    child: "Alex",
    day: "SAT",
    time: "09:00",
    title: "Riverside vs Hillcrest",
    detail: "U13 · Riverside grounds",
    kind: "Match",
  },
];
export default function ParentPreview() {
  const [child, setChild] = useState("All children"),
    [view, setView] = useState("This week");
  const rows = sessions.filter(
    (r) => child === "All children" || r.child === child,
  );
  return (
    <div
      className={s.preview}
      role="region"
      aria-label="Parent dashboard example"
    >
      <div className={s.top}>
        <span>PARENT WORKSPACE</span>
        <span>Interactive example</span>
      </div>
      <div className={s.header}>
        <div className={s.circles} aria-hidden="true">
          <span>A</span>
          <span>J</span>
        </div>
        <h3>
          Your family.
          <br />
          One view.
        </h3>
        <p>Every practice. Every milestone.</p>
      </div>
      <div className={s.body}>
        <label className={s.filter}>
          Show children
          <select
            value={child}
            onChange={(e) => setChild(e.target.value)}
            aria-label="Parent example child"
          >
            <option>All children</option>
            <option>Alex</option>
            <option>Jamie</option>
          </select>
        </label>
        <div className={s.tabs} role="group" aria-label="Parent example view">
          {["This week", "Team updates"].map((tab) => (
            <button
              key={tab}
              aria-pressed={view === tab}
              onClick={() => setView(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className={s.records} aria-live="polite">
          {view === "This week" ? (
            rows.map((r) => (
              <article key={r.title} className={s.row}>
                <div className={s.date}>
                  {r.day}
                  <strong>{r.time}</strong>
                </div>
                <div>
                  <span className={s.child}>
                    {r.child} · {r.kind}
                  </span>
                  <h4>{r.title}</h4>
                  <p>{r.detail}</p>
                </div>
              </article>
            ))
          ) : (
            <>
              {(child === "All children" || child === "Alex") && (
                <article className={s.update}>
                  <span className={s.child}>Alex · U13 coach</span>
                  <h4>Ready for Saturday?</h4>
                  <p>
                    Please arrive 30 minutes before kick-off. Bring your
                    mouthguard and water bottle.
                  </p>
                </article>
              )}
              {(child === "All children" || child === "Jamie") && (
                <article className={s.update}>
                  <span className={s.child}>Jamie · U16 coach</span>
                  <h4>Thursday’s gym session</h4>
                  <p>
                    Meet at the club gym at 15:30. Remember your training shoes
                    and towel.
                  </p>
                </article>
              )}
            </>
          )}
        </div>
        <p className={s.note}>
          Example family and sessions. Try filtering by child.
        </p>
      </div>
    </div>
  );
}
