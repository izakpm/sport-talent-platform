"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import AuthModal from "./AuthModal";
import styles from "./auth.module.css";
import { API_URL } from "./lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  useEffect(() => {
    const selected = new URLSearchParams(window.location.search).get("role");
    if (
      selected &&
      ["ATHLETE", "COACH", "GUARDIAN", "SCHOOL"].includes(selected)
    )
      setRole(selected);
  }, []);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isFormValid = role && email && password && firstName && lastName;
  const isGoogleReady = Boolean(role);

  const handleGoogleAuth = () => {
    if (!role) {
      alert("Please select a role before continuing with Google.");
      return;
    }

    const query = `?role=${encodeURIComponent(role)}`;
    window.location.href = `${API_URL}/auth/google${query}`;
  };

  const register = async () => {
    if (!isFormValid || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role,
          first_name: firstName,
          last_name: lastName,
        }),
      });
      if (!res.ok) {
        setError(
          "We could not create your account. Check your details or try logging in if you already have an account.",
        );
        return;
      }
      router.replace("/login?registered=1", { scroll: false });
    } catch {
      setError("We could not connect. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthModal title="Create your account">
      <p className={styles.intro}>Your sporting journey starts here.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <fieldset className={styles.roles}>
        <legend>Join as</legend>
        {["ATHLETE", "COACH", "GUARDIAN", "SCHOOL"].map((r) => (
          <button
            type="button"
            key={r}
            aria-pressed={role === r}
            onClick={() => setRole(r)}
          >
            {r === "SCHOOL"
              ? "School / Club"
              : r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
      </fieldset>
      <button
        type="button"
        className={styles.google}
        onClick={handleGoogleAuth}
        disabled={!isGoogleReady || busy}
      >
        <img src="/Google.png" alt="" width="20" height="20" />
        Continue with Google
      </button>
      {!isGoogleReady && (
        <p className={styles.hint}>Choose your role to continue with Google.</p>
      )}
      <div className={styles.divider}>or register with email</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void register();
        }}
      >
        <div className={styles.names}>
          <label className={styles.field}>
            First name
            <input
              autoComplete="given-name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            Last name
            <input
              autoComplete="family-name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
        </div>
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
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className={styles.submit} disabled={!isFormValid || busy}>
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className={styles.switch}>
        Already registered?{" "}
        <Link href="/login" scroll={false}>
          Log in
        </Link>
      </p>
      <p className={styles.privacy}>
        Read our <Link href="/privacy">Privacy policy</Link> to learn how we
        handle your information.
      </p>
    </AuthModal>
  );
}
