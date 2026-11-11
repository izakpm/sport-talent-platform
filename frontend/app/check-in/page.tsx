"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { hub, type HubEvent, attendanceLabel } from "../dashboard/team-hub/api";
import {
  rememberCheckIn,
  pendingCheckIn,
  clearCheckIn,
} from "../lib/check-in-return";
import s from "../dashboard/coaches/workspace.module.css";
import h from "../dashboard/team-hub/hub.module.css";
export default function CheckIn() {
  const [code, setCode] = useState(""),
    [event, setEvent] = useState<HubEvent | null>(null),
    [error, setError] = useState(""),
    [login, setLogin] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [result, setResult] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const value =
      new URLSearchParams(window.location.hash.slice(1)).get("code") ||
      pendingCheckIn();
    setCode(value);
    if (!/^[A-Za-z0-9_-]{43}$/.test(value)) {
      setError("Scan the QR code displayed by your coach to check in.");
      setLoading(false);
      return;
    }
    rememberCheckIn(value);
    window.history.replaceState({}, "", window.location.pathname);
    if (!localStorage.getItem("token")) {
      setLogin(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    hub<{ event: HubEvent }>("/check-in/preview", { code: value })
      .then((data) => {
        if (active) setEvent(data.event);
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
  async function confirm() {
    setBusy(true);
    setError("");
    try {
      const data = await hub<{ status: string; method: string }>("/check-in", {
        code,
      });
      setResult(attendanceLabel(data.status, data.method));
      clearCheckIn();
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
        <h1>Session check-in</h1>
        {loading ? (
          <p role="status">Checking session…</p>
        ) : login ? (
          <>
            <p>
              Sign in to your athlete account to record your attendance. We’ll
              bring you back to this session.
            </p>
            <Link className={s.primary} href="/login">
              Sign in to check in
            </Link>
            <p>
              New to PlayVerified?{" "}
              <Link href="/register">Create an athlete account</Link>, then ask
              your coach to link it to your team.
            </p>
          </>
        ) : result ? (
          <>
            <p role="status" className={s.notice}>
              {result}
            </p>
            <p>
              {result === "Checked in by QR"
                ? "Your check-in has been recorded."
                : result === "Verified by coach"
                  ? "Your coach has already confirmed your attendance."
                  : "Your coach has already reviewed this record. Speak to them if it needs correcting."}
            </p>
            <Link className={s.primary} href="/dashboard/athlete/activities#attendance">
              View my attendance
            </Link>
          </>
        ) : (
          <>
            {event && (
              <>
                <h2>{event.title}</h2>
                <p>
                  {event.team_name}
                  <br />
                  {event.date} · {event.start_time}–{event.end_time}
                  <br />
                  {event.venue}
                </p>
                <p>Confirm only if you are at this session.</p>
                <button className={s.primary} disabled={busy} onClick={confirm}>
                  {busy ? "Checking in…" : "I’m here — check in"}
                </button>
              </>
            )}
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            {!event && code && (
              <button
                className={s.secondary}
                onClick={() => setRetry((n) => n + 1)}
              >
                Try again
              </button>
            )}
          </>
        )}
        <p>
          <Link href="/dashboard" onClick={clearCheckIn}>
            Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
