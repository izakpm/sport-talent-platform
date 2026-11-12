"use client";
import { useEffect, useState } from "react";
import type { GuardianChild } from "../../lib/guardian-context";
import {
  TrainingEditor,
  TrainingAction,
} from "../athlete/activities/TrainingLog";
import {
  trainingDate,
  trainingStatus,
  type TrainingActivity,
  type TrainingOptions,
} from "../team-hub/training-api";
import { childRead, childWrite } from "./family-data";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";

export function ParentTraining({
  child,
  activities,
}: {
  child: GuardianChild;
  activities: TrainingActivity[];
}) {
  const [rows, setRows] = useState(activities);
  const [options, setOptions] = useState<TrainingOptions | null>(null);
  const [editor, setEditor] = useState<TrainingActivity | "new" | null>(null);
  const [action, setAction] = useState<{
    kind: "request" | "withdraw" | "delete";
    activity: TrainingActivity;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => setRows(activities), [activities]);
  const name = `${child.first_name} ${child.last_name}`;
  async function open(next: () => void) {
    setLoading(true);
    setError("");
    try {
      setOptions(
        await childRead<TrainingOptions>(child, "/activities/options"),
      );
      next();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  function saved(updated: TrainingActivity[]) {
    setRows(updated);
    setNotice(
      action?.kind === "request"
        ? `Verification request sent for ${name}.`
        : action?.kind === "withdraw"
          ? `Request withdrawn for ${name}.`
          : action?.kind === "delete"
            ? `Session deleted for ${name}.`
            : `Session saved for ${name}. You can request coach verification below.`,
    );
    setEditor(null);
    setAction(null);
  }
  const saveRequest = <T,>(path = "", method = "GET", body?: unknown) =>
    childWrite<T>(child, "/activities" + path, method, body);
  if (child.mode !== "managed" || child.status !== "accepted") return null;
  return (
    <section className={p.card} aria-label={`${name} training`}>
      <div className={p.sectionHeading}>
        <h2>{name}'s training</h2>
        <button
          className={s.primary}
          disabled={loading}
          onClick={() => open(() => setEditor("new"))}
        >
          Log training +
        </button>
      </div>
      <p>
        Record completed training, then ask your child's coach to verify it.
      </p>
      {loading && <p role="status">Loading session options…</p>}
      {error && (
        <p role="alert" className={s.formError}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {!rows.length && <p>No training logged yet.</p>}
      {rows.map((activity) => {
        const editable = ["self_reported", "declined"].includes(
          activity.status,
        );
        return (
          <article key={activity.id} className={p.record}>
            <h3>{activity.title}</h3>
            <p>
              {trainingDate(activity.date)} · {activity.training_kind} ·{" "}
              {activity.duration_minutes ?? "—"} minutes ·{" "}
              {trainingStatus(activity.status)}
            </p>
            {activity.description && <p>{activity.description}</p>}
            {activity.coach_name && <p>Coach: {activity.coach_name}</p>}
            {activity.review_note && (
              <p>Coach feedback: {activity.review_note}</p>
            )}
            <div className={p.actions}>
              {editable && (
                <>
                  <button
                    className={s.primary}
                    disabled={loading}
                    onClick={() =>
                      open(() => setAction({ kind: "request", activity }))
                    }
                  >
                    Request verification
                  </button>
                  <button
                    className={s.secondary}
                    disabled={loading}
                    onClick={() => open(() => setEditor(activity))}
                  >
                    Edit session
                  </button>
                  <button
                    className={s.secondary}
                    disabled={loading}
                    onClick={() =>
                      open(() => setAction({ kind: "delete", activity }))
                    }
                  >
                    Delete
                  </button>
                </>
              )}
              {activity.status === "pending" && (
                <button
                  className={s.secondary}
                  disabled={loading}
                  onClick={() =>
                    open(() => setAction({ kind: "withdraw", activity }))
                  }
                >
                  Withdraw request
                </button>
              )}
            </div>
          </article>
        );
      })}
      {editor && options && (
        <TrainingEditor
          activity={editor === "new" ? null : editor}
          options={options}
          childName={name}
          saveRequest={saveRequest}
          close={() => setEditor(null)}
          saved={saved}
        />
      )}
      {action && options && (
        <TrainingAction
          action={action}
          options={options}
          childName={name}
          saveRequest={saveRequest}
          close={() => setAction(null)}
          saved={saved}
        />
      )}
    </section>
  );
}
