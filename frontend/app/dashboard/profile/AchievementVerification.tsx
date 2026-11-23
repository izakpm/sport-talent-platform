"use client";
import { useEffect, useState, type FormEvent } from "react";
import { fetchWithAuth } from "../../lib/api";
import { Modal } from "../coaches/CoachWorkspace";
import { notifyAttendance } from "../team-hub/api";
import s from "../coaches/workspace.module.css";
import a from "./athlete-profile.module.css";

export async function achievementApi<T>(
  path: string,
  method = "GET",
  body?: object,
  childId?: string,
): Promise<T> {
  const res = await fetchWithAuth("/athlete-profile" + path, {
    method,
    ...(childId ? { headers: { "X-Athlete-Id": childId } } : {}),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res) throw Error("Please sign in again.");
  const data = await res.json();
  if (!res.ok)
    throw Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to update verification. Please try again.",
    );
  return data;
}
type VerifiedEntry = {
  id: string;
  title: string;
  verification_status?: string;
  verification_coach_name?: string;
  review_note?: string;
};
export default function AchievementVerification({
  entry,
  onChanged,
  childId,
  readOnly = false,
}: {
  entry: VerifiedEntry;
  onChanged: () => void;
  childId?: string;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const status = entry.verification_status || "self_reported";
  async function withdraw() {
    setBusy(true);
    setError("");
    try {
      await achievementApi(
        `/entries/${entry.id}/request`,
        "DELETE",
        undefined,
        childId,
      );
      onChanged();
      notifyAttendance();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={a.verificationControls}>
      <span className={a.badge} data-status={status}>
        {status === "verified"
          ? "Coach verified"
          : status === "pending"
            ? "Awaiting coach review"
            : status === "declined"
              ? "Changes requested"
              : "Self-reported"}
      </span>
      {entry.verification_coach_name && (
        <small>
          {status === "pending" ? "Requested from" : "Reviewed by"}{" "}
          {entry.verification_coach_name}
        </small>
      )}
      {entry.review_note && <p className={a.notes}>{entry.review_note}</p>}
      {!readOnly &&
        status !== "verified" &&
        (status === "pending" ? (
          <button className={s.secondary} disabled={busy} onClick={withdraw}>
            Withdraw request
          </button>
        ) : (
          <button className={s.primary} onClick={() => setOpen(true)}>
            Request verification
          </button>
        ))}
      {error && (
        <p role="alert" className={s.formError}>
          {error}
        </p>
      )}
      {open && (
        <RequestAchievement
          entry={entry}
          childId={childId}
          close={() => setOpen(false)}
          saved={() => {
            setOpen(false);
            onChanged();
            notifyAttendance();
          }}
        />
      )}
    </div>
  );
}
function RequestAchievement({
  entry,
  childId,
  close,
  saved,
}: {
  entry: VerifiedEntry;
  childId?: string;
  close: () => void;
  saved: () => void;
}) {
  const [coaches, setCoaches] = useState<
      { id: string; name: string; teams: string }[] | null
    >(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    achievementApi<{ id: string; name: string; teams: string }[]>(
      "/verification-coaches",
      "GET",
      undefined,
      childId,
    )
      .then((rows) => {
        if (active) setCoaches(rows);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [childId, retry]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await achievementApi(
        `/entries/${entry.id}/request`,
        "POST",
        { coach_id: f.get("coach_id"), note: f.get("note") },
        childId,
      );
      saved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Request achievement verification"
      description={entry.title}
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        {coaches === null ? (
          <p>Loading linked coaches…</p>
        ) : !coaches.length ? (
          <p>
            No linked coaches are available. Join your coach’s team before
            requesting verification.
          </p>
        ) : (
          <>
            <label>
              Coach
              <select name="coach_id" required disabled={busy} defaultValue="">
                <option value="">Choose a linked coach</option>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.teams}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message to your coach (optional)
              <textarea
                name="note"
                rows={3}
                maxLength={1000}
                disabled={busy}
                placeholder="Add context to help your coach confirm this achievement."
              />
            </label>
            <p className={s.formTip}>
              Your coach reviews the complete achievement, including selection
              and captaincy where recorded. Withdraw a pending request before
              editing. Verified records are locked.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className={s.formError}>
            {error}
            {coaches === null && (
              <button type="button" onClick={() => setRetry((n) => n + 1)}>
                Retry
              </button>
            )}
          </p>
        )}
        <div className={s.formFooter}>
          <button
            type="button"
            className={s.secondary}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={s.primary} disabled={busy || !coaches?.length}>
            {busy ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
