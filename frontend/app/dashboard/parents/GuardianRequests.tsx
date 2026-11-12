"use client";
import { useEffect, useState } from "react";
import { childContext } from "../../lib/guardian-context";
import { family } from "./family-api";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";
type Request = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
};
export default function GuardianRequests() {
  const [rows, setRows] = useState<Request[]>([]),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [busy, setBusy] = useState(false);
  const delegated = !!childContext();
  useEffect(() => {
    if (delegated) return;
    let active = true;
    family<Request[]>("/requests")
      .then((r) => {
        if (active) {
          setRows(r);
          setError("");
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [retry, delegated]);
  async function decide(id: string, status: string) {
    setBusy(true);
    setError("");
    try {
      await family("/requests/" + id, { status });
      setRetry((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (delegated) return null;
  return (
    <section className={p.card} style={{ marginTop: 24 }}>
      <div className={s.header}>
        <h2>Parents & guardians</h2>
        <button className={s.secondary} onClick={() => setRetry((v) => v + 1)}>
          Refresh parent links
        </button>
      </div>
      <p>
        Approve people you know to give them read-only access to your sporting
        profile, achievements, performance metrics, calendar, matches and team
        feed. They cannot edit your records. You can remove access at any time.
      </p>
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {!rows.length && !error && <p>No parent links or requests yet.</p>}
      {rows.map((r) => (
        <article key={r.id}>
          <h3>
            {r.first_name} {r.last_name}
          </h3>
          <p>
            {r.email} ·{" "}
            {r.status === "accepted"
              ? "Can view your sporting information"
              : "Requesting access"}
          </p>
          <div className={p.actions}>
            {r.status === "pending" ? (
              <>
                <button
                  className={s.primary}
                  disabled={busy}
                  onClick={() => decide(r.id, "accepted")}
                >
                  Approve parent link
                </button>
                <button
                  className={s.secondary}
                  disabled={busy}
                  onClick={() => decide(r.id, "declined")}
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                className={s.secondary}
                disabled={busy}
                onClick={() => decide(r.id, "revoked")}
              >
                Remove access
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
