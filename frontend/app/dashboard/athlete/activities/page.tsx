"use client";
import TrainingLog from "./TrainingLog";
import AttendancePage from "../../team-hub/AttendancePage";
import { useSectionHash } from "../../core/useSectionHash";
import s from "../../coaches/workspace.module.css";
import a from "./activities.module.css";
export default function AthleteActivities() {
  const [tab, select] = useSectionHash(["training", "attendance"], "training");
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>MY ACTIVITY</p>
          <h1>Activities</h1>
          <p className={s.subtitle}>
            Your training, team attendance and coach confirmations in one place.
          </p>
        </div>
      </header>
      <div className={a.tabs} role="tablist" aria-label="Activity sections">
        {(
          [
            ["training", "Training log"],
            ["attendance", "Team attendance"],
          ] as const
        ).map(([key, label], index) => (
          <button
            key={key}
            id={`activity-tab-${key}`}
            role="tab"
            aria-selected={tab === key}
            aria-controls="activity-panel"
            tabIndex={tab === key ? 0 : -1}
            className={tab === key ? s.primary : s.secondary}
            onClick={() => select(key)}
            onKeyDown={(e) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? "training"
                    : e.key === "End"
                      ? "attendance"
                      : index === 0
                        ? "attendance"
                        : "training";
                select(next);
                document.getElementById(`activity-tab-${next}`)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <section
        id="activity-panel"
        role="tabpanel"
        aria-labelledby={`activity-tab-${tab}`}
      >
        {tab === "attendance" ? <AttendancePage embedded /> : <TrainingLog />}
      </section>
    </div>
  );
}
