"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchWithAuth } from "../lib/api";
import { childContext, childWorkspacePath } from "../lib/guardian-context";
import s from "./account-security.module.css";

type Security = {
  email: string | null;
  managed: boolean;
  google: boolean;
  password: "enabled" | "disabled" | "unknown";
};
export default function AccountSecurity() {
  const [account, setAccount] = useState<Security | null>(null);
  const [child, setChild] = useState<"managed" | "view" | null>(null);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const selected = childWorkspacePath(window.location.pathname)
      ? childContext()
      : null;
    if (selected) {
      setChild(selected.mode);
      return;
    }
    setError("");
    fetchWithAuth("/auth/security")
      .then(async (res) => {
        if (!res) return;
        if (!res.ok) throw new Error("Unable to load account security.");
        const data = await res.json();
        if (active) setAccount(data);
      })
      .catch(() => {
        if (active)
          setError("Unable to load account security. Please try again.");
      });
    return () => {
      active = false;
    };
  }, [retry]);

  async function change(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Your new passwords do not match.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Your password is too long. Use no more than 72 bytes.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetchWithAuth("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: current,
          newPassword: password,
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to change your password.",
        );
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("guardian-child");
      window.location.assign("/login?passwordChanged=1");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.card} aria-labelledby="account-security-title">
      <header>
        <h2 id="account-security-title">Account &amp; security</h2>
        <p>Manage how you sign in to PlayVerified.</p>
      </header>
      <div className={s.content}>
        {child || account?.managed ? (
          <p>
            {child === "view"
              ? "This athlete manages their own sign-in details. Your parent link does not give access to their password."
              : "This child’s profile is managed by their parent and has no separate email or password."}{" "}
            <Link href="/dashboard/parents/profile">
              Manage your own account
            </Link>
          </p>
        ) : (
          <>
            {account && (
              <>
                <div className={s.details}>
                  <div>
                    <span>Sign-in email</span>
                    <strong>{account.email}</strong>
                  </div>
                  <div>
                    <span>Sign-in method</span>
                    <strong>
                      {account.google
                        ? account.password === "enabled"
                          ? "Google and password"
                          : "Google"
                        : account.password === "enabled"
                          ? "Email and password"
                          : "Email account"}
                    </strong>
                  </div>
                </div>
                {account.password === "disabled" ? (
                  <p>
                    You sign in with Google. Your Google password is managed in
                    your{" "}
                    <a
                      href="https://myaccount.google.com/security"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Google account ↗
                    </a>
                    .
                  </p>
                ) : (
                  <>
                    {account.password === "unknown" && (
                      <p>
                        If you normally sign in with Google, you can continue
                        using Google. Email recovery lets you set or reset a
                        separate PlayVerified password.
                      </p>
                    )}
                    {!editing ? (
                      <div className={s.actions}>
                        <button onClick={() => setEditing(true)}>
                          Change password
                        </button>
                        <Link href="/forgot-password" scroll={false}>
                          Forgot password?
                        </Link>
                      </div>
                    ) : (
                      <form onSubmit={change}>
                        <div className={s.fields}>
                          <label>
                            Current password
                            <input
                              type="password"
                              autoComplete="current-password"
                              required
                              value={current}
                              onChange={(e) => setCurrent(e.target.value)}
                            />
                          </label>
                          <label>
                            New password
                            <input
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={12}
                              maxLength={72}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                          </label>
                          <label>
                            Confirm new password
                            <input
                              type="password"
                              autoComplete="new-password"
                              required
                              minLength={12}
                              maxLength={72}
                              value={confirmation}
                              onChange={(e) => setConfirmation(e.target.value)}
                            />
                          </label>
                        </div>
                        <p>
                          Use at least 12 characters. After changing your
                          password, you’ll need to log in again on all devices.
                        </p>
                        <div className={s.actions}>
                          <button disabled={busy}>
                            {busy ? "Updating…" : "Save new password"}
                          </button>
                          <button
                            type="button"
                            className={s.secondary}
                            disabled={busy}
                            onClick={() => {
                              setEditing(false);
                              setCurrent("");
                              setPassword("");
                              setConfirmation("");
                              setError("");
                            }}
                          >
                            Cancel
                          </button>
                          <Link href="/forgot-password" scroll={false}>
                            Forgot password?
                          </Link>
                        </div>
                      </form>
                    )}
                  </>
                )}
              </>
            )}
            {!account && !error && (
              <p role="status">Loading account security…</p>
            )}
          </>
        )}
        {error && (
          <p className={s.error} role="alert">
            {error}{" "}
            {!account && (
              <button onClick={() => setRetry((v) => v + 1)}>Retry</button>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
