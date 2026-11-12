"use client";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { fetchWithAuth } from "../../lib/api";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";
import c from "./parent-profile.module.css";
type Parent = {
  id: string;
  role: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  profile_image: string | null;
};
type Details = Pick<
  Parent,
  "first_name" | "last_name" | "phone" | "profile_image"
>;
const details = (user: Parent): Details => ({
  first_name: user.first_name || "",
  last_name: user.last_name || "",
  phone: user.phone || "",
  profile_image: user.profile_image || null,
});
async function request(body?: Partial<Details>): Promise<Parent> {
  const res = await fetchWithAuth(
    "/guardian/profile",
    body
      ? { method: "PATCH", body: JSON.stringify(body) }
      : { cache: "no-store" },
  );
  if (!res) throw Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to load or save your profile. Please try again.",
    );
  return data;
}
function remember(user: Parent) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    /* The saved server profile remains authoritative. */
  }
  window.dispatchEvent(new CustomEvent("profile-updated", { detail: user }));
}
export default function ParentProfile() {
  const [user, setUser] = useState<Parent | null>(null),
    [draft, setDraft] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0);
  const photoInput = useRef<HTMLInputElement>(null),
    generation = useRef(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    request()
      .then((v) => {
        if (live) {
          setUser(v);
          setDraft(details(v));
          remember(v);
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
      generation.current++;
    };
  }, [retry]);
  async function photo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const version = ++generation.current;
    setError("");
    setNotice("");
    if (
      file.size > 2097152 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setReading(false);
      setError("Choose a JPG, PNG or WebP photo up to 2 MB.");
      e.target.value = "";
      return;
    }
    setReading(true);
    try {
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(Error("Unable to read that photo. Please choose another."));
        reader.readAsDataURL(file);
      });
      if (version === generation.current)
        setDraft((v) => (v ? { ...v, profile_image: image } : v));
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      if (version === generation.current) setReading(false);
    }
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft || !user || busy || reading) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const previous = details(user);
      const changes = Object.fromEntries(
        Object.entries(draft).filter(
          ([key, value]) => value !== previous[key as keyof Details],
        ),
      );
      const updated = await request(changes);
      setUser(updated);
      setDraft(details(updated));
      remember(updated);
      setNotice("Your profile has been updated.");
      if (photoInput.current) photoInput.current.value = "";
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const name = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ")
    : "";
  const dirty =
    !!user && JSON.stringify(draft) !== JSON.stringify(details(user));
  return (
    <div className={`${s.workspace} ${p.page}`}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR PARENT ACCOUNT</p>
          <h1>My profile</h1>
          <p className={s.subtitle}>
            Keep your personal details and profile photo up to date.
          </p>
        </div>
        <Link className={s.secondary} href="/dashboard/parents/children">
          My children ↗
        </Link>
      </header>
      {loading ? (
        <p role="status" className={s.loading}>
          Loading your profile…
        </p>
      ) : !user || !draft ? (
        <>
          <p role="alert" className={s.error}>
            {error}
          </p>
          <button className={s.primary} onClick={() => setRetry((v) => v + 1)}>
            Try again
          </button>
        </>
      ) : (
        <>
          <section className={`${p.hero} ${c.hero}`}>
            <div className={c.avatar}>
              {user.profile_image ? (
                <img src={user.profile_image} alt={`${name}'s profile photo`} />
              ) : (
                <span aria-hidden="true">{user.first_name?.[0] || "P"}</span>
              )}
            </div>
            <div>
              <span className={p.eyebrow}>PARENT / GUARDIAN</span>
              <h2>{name || "Your profile"}</h2>
              <p>{user.email}</p>
            </div>
          </section>
          <form className={`${p.card} ${s.form}`} onSubmit={save}>
            <h2>Your details</h2>
            <fieldset disabled={busy} className={c.fields}>
              <div className={c.photoRow}>
                <div className={c.preview}>
                  {draft.profile_image ? (
                    <img
                      src={draft.profile_image}
                      alt="New profile photo preview"
                    />
                  ) : (
                    <span aria-hidden="true">
                      {draft.first_name?.[0] || "P"}
                    </span>
                  )}
                </div>
                <div>
                  <label>
                    Profile photo
                    <input
                      ref={photoInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={photo}
                    />
                  </label>
                  <p className={s.formTip}>
                    JPG, PNG or WebP, up to 2 MB. Save your changes to apply the
                    photo.
                  </p>
                  {draft.profile_image && (
                    <button
                      className={s.secondary}
                      type="button"
                      disabled={reading}
                      onClick={() => {
                        generation.current++;
                        setDraft({ ...draft, profile_image: null });
                        setNotice("");
                        if (photoInput.current) photoInput.current.value = "";
                      }}
                    >
                      Remove photo
                    </button>
                  )}
                  {reading && <p role="status">Reading photo…</p>}
                </div>
              </div>
              <div className={s.formRow}>
                <label>
                  First name
                  <input
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    value={draft.first_name}
                    onChange={(e) => {
                      setDraft({ ...draft, first_name: e.target.value });
                      setNotice("");
                    }}
                  />
                </label>
                <label>
                  Last name
                  <input
                    autoComplete="family-name"
                    required
                    maxLength={80}
                    value={draft.last_name}
                    onChange={(e) => {
                      setDraft({ ...draft, last_name: e.target.value });
                      setNotice("");
                    }}
                  />
                </label>
              </div>
              <div className={s.formRow}>
                <label>
                  Phone number (optional)
                  <input
                    type="tel"
                    autoComplete="tel"
                    maxLength={40}
                    value={draft.phone || ""}
                    placeholder="e.g. +27 82 123 4567"
                    onChange={(e) => {
                      setDraft({ ...draft, phone: e.target.value });
                      setNotice("");
                    }}
                  />
                </label>
                <div>
                  <label htmlFor="parent-email">Sign-in email</label>
                  <input
                    id="parent-email"
                    type="email"
                    value={user.email || ""}
                    readOnly
                    aria-describedby="parent-email-note"
                  />
                  <small id="parent-email-note">
                    Your sign-in email is read-only on this page.
                  </small>
                </div>
              </div>
            </fieldset>
            {error && (
              <p role="alert" className={s.formError}>
                {error}
              </p>
            )}
            {notice && (
              <p role="status" className={s.notice}>
                {notice}
              </p>
            )}
            <div className={s.formFooter}>
              <button
                type="button"
                className={s.secondary}
                disabled={busy || reading || !dirty}
                onClick={() => {
                  generation.current++;
                  setDraft(details(user));
                  setError("");
                  setNotice("");
                  if (photoInput.current) photoInput.current.value = "";
                }}
              >
                Cancel changes
              </button>
              <button
                className={s.primary}
                disabled={busy || reading || !dirty}
              >
                {busy ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
          <section className={`${p.card} ${c.family}`}>
            <h2>Your children's sporting profiles</h2>
            <p>
              Manage their details, positions, achievements and performance
              metrics from My children.
            </p>
            <Link
              className={s.secondary}
              href="/dashboard/parents/children/profiles"
            >
              View children's profiles ↗
            </Link>
          </section>
        </>
      )}
    </div>
  );
}
