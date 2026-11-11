"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import styles from "./auth.module.css";
import Link from "next/link";
import { checkInReturn } from "./lib/check-in-return";
import { API_URL } from "./lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [registered, setRegistered] = useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isFormValid = email && password;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRegistered(params.get("registered") === "1");
    const token =
      new URLSearchParams(window.location.hash.slice(1)).get("token") ||
      params.get("token");

    if (!token) return;
    // Remove credentials before any further navigation or requests.
    params.delete("token");
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${params.size ? `?${params}` : ""}`,
    );

    const processGoogleLogin = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Unable to verify Google session");
        }

        const user = await res.json();
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.userId,
            email: user.email,
            role: user.role,
          }),
        );
        router.replace(checkInReturn() || "/dashboard");
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setGoogleError(
          "Google sign-in could not be completed. Please try again.",
        );
      }
    };

    processGoogleLogin();
  }, [router]);

  const handleGoogleAuth = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogin = async () => {
    if (!isFormValid || busy) return;
    setBusy(true);
    setError("");
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // First try direct backend URL (from env). If that fails (network/CORS),
      // fall back to a relative path which Next dev can proxy via rewrites.
      let res: Response | null = null;
      try {
        res = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
      } catch (e) {
        console.warn("Direct API fetch failed, trying proxy /auth/login", e);
        res = await fetch("/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
      }

      if (!res.ok) {
        // Surface API status for easier debugging
        const text = await res.text().catch(() => null);
        console.error("Login failed", { status: res.status, text });
        setError("Email or password is incorrect. Please try again.");
        return;
      }

      const data = await res.json();

      // ✅ Save session
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ Go to dashboard (send SCHOOL users to the schools dashboard)
      const destination =
        data.user?.role === "SCHOOL" ? "/dashboard/schools" : "/dashboard";
      router.push(checkInReturn() || destination);
    } catch (err: any) {
      console.error("Login request error", err);
      setError("We could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthModal title="Welcome back">
      <p className={styles.intro}>Log in to your PlayVerified account.</p>
      {registered && (
        <p role="status" className={styles.intro}>
          Your account is ready. Log in to get started.
        </p>
      )}
      {(googleError || error) && (
        <p className={styles.error} role="alert">
          {googleError || error}
        </p>
      )}
      <button
        type="button"
        className={styles.google}
        onClick={handleGoogleAuth}
        disabled={busy}
      >
        <img src="/Google.png" alt="" width="20" height="20" />
        Sign in with Google
      </button>
      <div className={styles.divider}>or use your email</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleLogin();
        }}
      >
        <label className={styles.field}>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className={styles.field}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className={styles.submit} disabled={!isFormValid || busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className={styles.switch}>
        New to PlayVerified?{" "}
        <Link href="/register" scroll={false}>
          Register
        </Link>
      </p>
      <p className={styles.privacy}>
        <Link href="/privacy">Privacy policy</Link>
      </p>
    </AuthModal>
  );
}
