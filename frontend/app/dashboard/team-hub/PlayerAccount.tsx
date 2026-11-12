"use client";
import { useEffect, useState, type FormEvent } from "react";
import { hub } from "./api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
type LinkRecord = {
  player_id: string;
  email: string;
  first_name: string;
  last_name: string;
};
export default function PlayerAccount({
  teamId,
  playerId,
  name,
  close,
}: {
  teamId: string;
  playerId: string;
  name: string;
  close: () => void;
}) {
  const [current, setCurrent] = useState<LinkRecord | null>(null),
    [email, setEmail] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    hub<LinkRecord[]>(`/teams/${teamId}/links`)
      .then((rows) => {
        if (active)
          setCurrent(rows.find((r) => r.player_id === playerId) || null);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [teamId, playerId, retry]);
  async function save(unlink = false) {
    setBusy(true);
    setError("");
    try {
      await hub(`/teams/${teamId}/players/${playerId}/link`, {
        email: unlink ? null : email,
      });
      setNotice(
        unlink
          ? "Account unlinked. Past attendance records are retained."
          : "Athlete linked. Their account or parent can now see the team schedule, updates and attendance.",
      );
      setRetry((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Link athlete account"
      description={name}
      close={() => !busy && close()}
    >
      {error && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {loading ? (
        <p>Loading account link…</p>
      ) : current ? (
        <div className={s.form}>
          <p>
            Linked to{" "}
            <strong>
              {current.first_name} {current.last_name}
            </strong>
            <br />
            {current.email || "Parent-managed athlete (no email)"}
          </p>
          <p>
            Unlinking removes access to this team’s feed and future check-ins.
            Attendance history is retained.
          </p>
          <div className={s.formFooter}>
            <button className={s.secondary} disabled={busy} onClick={close}>
              Done
            </button>
            <button
              className={s.danger}
              disabled={busy}
              onClick={() => save(true)}
            >
              Unlink account
            </button>
          </div>
        </div>
      ) : (
        <form
          className={s.form}
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            save();
          }}
        >
          <p>
            Use the athlete’s registered email, or the sharing code their parent
            generated for a child without email. Check that it belongs to this
            player before linking.
          </p>
          <label>
            Athlete email or parent sharing code
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </label>
          <div className={s.formFooter}>
            <button
              type="button"
              className={s.secondary}
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button className={s.primary} disabled={busy}>
              {busy ? "Linking…" : "Link athlete account"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
