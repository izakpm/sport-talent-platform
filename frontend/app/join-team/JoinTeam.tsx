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
  role?: "ATHLETE" | "GUARDIAN";
  date_of_birth?: string | null;
  parent_required?: boolean;
  team_name: string;
  coach_name: string;
  age_group: string;
  expires_at: string;
};
export default function JoinTeam() {
  const [role, setRole] = useState("");
  const [resultStatus, setResultStatus] = useState("");
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
      setError("Open the invitation link shared by the coach.");
      setLoading(false);
      return;
    }
    if (!localStorage.getItem("token")) {
      setLogin(true);
      setLoading(false);
      return;
    }
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!["GUARDIAN", "ATHLETE"].includes(user?.role)) {
      setWrongRole(true);
      setLoading(false);
      return;
    }
    setRole(user.role);
    setError("");
    setLoading(true);
    Promise.all([
      family<Preview>("/team-invites/preview", { token: value }),
      user.role === "GUARDIAN"
        ? family<GuardianChild[]>("/children")
        : Promise.resolve([]),
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
      const result = await family<{ status: string }>(
        role === "ATHLETE"
          ? "/team-invites/athlete/accept"
          : "/team-invites/accept",
        {
          token,
          ...(role === "ATHLETE"
            ? !preview?.date_of_birth
              ? { date_of_birth: f.get("date_of_birth") }
              : {}
            : { child_id: f.get("child") }),
          consent: f.get("consent") === "on",
        },
      );
      setResultStatus(result.status);
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
        <h1>
          {role === "GUARDIAN"
            ? "Join your child's team"
            : "Your team invitation"}
        </h1>
        {loading ? (
          <p role="status">Checking invitation…</p>
        ) : login ? (
          <>
            <p>
              Sign in as an athlete to join for yourself, or as a parent to
              choose a child you manage. We’ll bring you back to this
              invitation.
            </p>
            <Link className={s.primary} href="/login">
              Log in to accept
            </Link>
            <p>
              New here?{" "}
              <Link href="/register?role=GUARDIAN">
                Create a parent account
              </Link>{" "}
              or{" "}
              <Link href="/register?role=ATHLETE">
                Create an athlete account
              </Link>
            </p>
          </>
        ) : wrongRole ? (
          <>
            <p>
              Sign in with an athlete or parent account to accept this
              invitation.
            </p>
            <Link href="/dashboard">Return to your dashboard to log out</Link>
          </>
        ) : done ? (
          <>
            <p className={s.notice} role="status">
              {resultStatus === "awaiting_parent"
                ? "Request sent. Waiting for parent approval."
                : "Request sent. Waiting for the coach to confirm."}
            </p>
            <p>
              {resultStatus === "awaiting_parent"
                ? "Your linked parent must approve in their Connections page before the coach can confirm. If no parent is linked yet, ask your parent to request a link from My children, then approve that request in your Connections page."
                : "Team access starts only after the coach confirms the player."}
            </p>
            <Link
              className={s.primary}
              href={
                role === "ATHLETE"
                  ? "/dashboard/athlete/connections"
                  : "/dashboard/parents/connections"
              }
            >
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
              Once confirmed, the athlete joins the roster and receives team
              schedules and announcements. The coach can identify the athlete on
              the roster, record attendance and review training verification
              requests. The athlete’s name is shared with the coach on
              acceptance. Athletes under 18 need a linked parent’s approval
              before coach confirmation.
            </p>
            <p>
              Expires {new Date(preview.expires_at).toLocaleDateString("en-ZA")}
              . One invitation is for one athlete.
            </p>
            {role === "ATHLETE" ? (
              <form className={s.form} onSubmit={accept}>
                {preview.date_of_birth ? (
                  <p>
                    Date of birth: {preview.date_of_birth}.{" "}
                    {preview.parent_required
                      ? "Parent approval is required."
                      : "You can request coach confirmation directly."}{" "}
                    Contact support if this date needs correcting.
                  </p>
                ) : (
                  <label>
                    Date of birth
                    <input
                      name="date_of_birth"
                      type="date"
                      required
                      min="1900-01-01"
                      max={new Date().toLocaleDateString("en-CA", {
                        timeZone: "Africa/Johannesburg",
                      })}
                      disabled={busy}
                    />
                    <small>
                      We use this to determine whether parent approval is
                      required. Once recorded here, it cannot be changed through
                      invitations.
                    </small>
                  </label>
                )}
                <label className={s.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="consent"
                    required
                    disabled={busy}
                  />{" "}
                  I want to join this team and agree to the team access
                  described above.
                </label>
                <button className={s.primary} disabled={busy}>
                  {busy ? "Sending…" : "Accept invitation"}
                </button>
              </form>
            ) : children.length ? (
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
            <Link
              href={
                role === "ATHLETE"
                  ? "/dashboard/athlete/connections"
                  : "/dashboard/parents/connections"
              }
            >
              Back to Connections
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
