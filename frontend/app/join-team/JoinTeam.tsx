"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { family } from "../dashboard/parents/family-api";
import type { GuardianChild } from "../lib/guardian-context";
import {
  clearTeamInvite,
  pendingTeamInvite,
  rememberTeamInvite,
} from "../lib/team-invite-return";
import s from "../dashboard/coaches/workspace.module.css";
import h from "../dashboard/team-hub/hub.module.css";
type Preview = {
  team_name: string;
  coach_name: string;
  age_group: string;
  expires_at: string;
};
export default function JoinTeam() {
  const [token, setToken] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [children, setChildren] = useState<GuardianChild[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [login, setLogin] = useState(false),
    [wrongRole, setWrongRole] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const value =
      new URLSearchParams(window.location.hash.slice(1)).get("invite") ||
      pendingTeamInvite();
    setToken(value);
    rememberTeamInvite(value);
    window.history.replaceState({}, "", window.location.pathname);
    if (!/^[A-Za-z0-9_-]{43}$/.test(value)) {
      setError("Open the invitation link shared by your child's coach.");
      setLoading(false);
      return;
    }
    if (!localStorage.getItem("token")) {
      setLogin(true);
      setLoading(false);
      return;
    }
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user?.role !== "GUARDIAN") {
      setWrongRole(true);
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    Promise.all([
      family<Preview>("/team-invites/preview", { token: value }),
      family<GuardianChild[]>("/children"),
    ])
      .then(([p, c]) => {
        if (active) {
          setPreview(p);
          setChildren(
            c.filter((v) => v.mode === "managed" && v.status === "accepted"),
          );
        }
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
  }, [retry]);
  async function accept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await family("/team-invites/accept", {
        token,
        child_id: f.get("child"),
        consent: f.get("consent") === "on",
      });
      clearTeamInvite();
      setDone(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className={h.publicPage}>
      <div className={`${s.workspace} ${h.publicCard}`}>
        <img
          src="/PlayVerified Logo.png"
          alt="PlayVerified"
          className={h.publicLogo}
        />
        <h1>Join your child's team</h1>
        {loading ? (
          <p role="status">Checking invitation…</p>
        ) : login ? (
          <>
            <p>
              Sign in as a parent to choose your child. We’ll bring you back to
              this invitation.
            </p>
            <Link className={s.primary} href="/login">
              Log in as a parent
            </Link>
            <p>
              New here?{" "}
              <Link href="/register?role=GUARDIAN">
                Create a parent account
              </Link>
            </p>
          </>
        ) : wrongRole ? (
          <>
            <p>
              This invitation must be accepted from a parent account. Your
              current account cannot enrol a child.
            </p>
            <Link href="/dashboard">Return to your dashboard to log out</Link>
          </>
        ) : done ? (
          <>
            <p className={s.notice} role="status">
              Request sent. Waiting for the coach to confirm.
            </p>
            <p>
              Your child will receive team access only after the coach confirms
              the player.
            </p>
            <Link className={s.primary} href="/dashboard/parents/connections">
              View invitations
            </Link>
          </>
        ) : preview ? (
          <>
            <h2>{preview.team_name}</h2>
            <p>
              {preview.age_group} · Invited by {preview.coach_name}
            </p>
            <p>
              Accept only if you recognise this coach and team. This invitation
              does not certify the coach's identity or qualifications.
            </p>
            <p>
              Once confirmed, your child joins the roster and receives team
              schedules and announcements. The coach can identify your child on
              the roster, record attendance and review training verification
              requests. Your name and your child's name are shared with the
              coach when you accept.
            </p>
            <p>
              Expires {new Date(preview.expires_at).toLocaleDateString("en-ZA")}
              . One invitation is for one child.
            </p>
            {children.length ? (
              <form className={s.form} onSubmit={accept}>
                <label>
                  Choose your child
                  <select name="child" required disabled={busy} defaultValue="">
                    <option value="">Select a child</option>
                    {children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    disabled={busy}
                  />{" "}
                  I am authorised to enrol this child and agree to the team
                  access described above.
                </label>
                <button className={s.primary} disabled={busy}>
                  {busy ? "Sending…" : "Accept and request to join"}
                </button>
              </form>
            ) : (
              <>
                <p>
                  Add a child you manage before accepting. Read-only links to
                  older athletes cannot enrol them in a team.
                </p>
                <Link className={s.primary} href="/dashboard/parents/children">
                  Add my child
                </Link>
                <button
                  className={s.secondary}
                  onClick={() => setRetry((v) => v + 1)}
                >
                  Refresh children
                </button>
              </>
            )}
          </>
        ) : null}
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        {!loading && !done && !login && !wrongRole && (
          <p>
            <Link href="/dashboard/parents/connections">
              Back to Connections
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
