"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import s from "./auth.module.css";
import { API_URL } from "./lib/api";

export default function PasswordRecovery({
  reset = false,
}: {
  reset?: boolean;
}) {
  const readToken = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (reset && !readToken.current) {
      readToken.current = true;
      const value =
        new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      setToken(value);
      window.history.replaceState(null, "", window.location.pathname);
    }
    setReady(true);
  }, [reset]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (reset && password !== confirm) {
      setError("Your passwords do not match.");
      return;
    }
    if (reset && new TextEncoder().encode(password).length > 72) {
      setError("Your password is too long. Use no more than 72 bytes.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `${API_URL}/auth/${reset ? "reset-password" : "forgot-password"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            reset ? { token, newPassword: password } : { email },
          ),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Unable to complete your request.",
        );
      setMessage(data.message);
      if (reset) {
        setToken("");
        setPassword("");
        setConfirm("");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("guardian-child");
      }
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
  const invalid = reset && ready && !/^[a-f0-9]{64}$/.test(token) && !message;
  return (
    <AuthModal
      title={reset ? "Choose a new password" : "Forgot your password?"}
    >
      <p className={s.intro}>
        {reset
          ? "Use at least 12 characters. Your existing sessions will end when you reset your password."
          : "Enter your sign-in email and we’ll send you instructions. Reset links are valid for 30 minutes."}
      </p>
      {message ? (
        <p role="status" className={s.intro}>
          {message}
        </p>
      ) : invalid ? (
        <p role="alert" className={s.error}>
          This reset link is missing or invalid.{" "}
          <Link href="/forgot-password" scroll={false}>
            Request a new link
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={submit}>
          {reset ? (
            <>
              <label className={s.field}>
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
              <label className={s.field}>
                Confirm new password
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  maxLength={72}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label className={s.field}>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          <button className={s.submit} disabled={busy || !ready}>
            {busy
              ? "Please wait…"
              : reset
                ? "Reset password"
                : "Send instructions"}
          </button>
        </form>
      )}
      {error && (
        <p className={s.error} role="alert">
          {error}{" "}
          {reset && (
            <Link href="/forgot-password" scroll={false}>
              Request a new link
            </Link>
          )}
        </p>
      )}
      {!reset && (
        <p className={s.intro}>
          Normally use Google? Choose “Sign in with Google” when logging in.
          Children without their own email sign in through their parent’s
          account.
        </p>
      )}
      <p className={s.switch}>
        <Link href="/login" scroll={false}>
          Back to log in
        </Link>
      </p>
    </AuthModal>
  );
}
