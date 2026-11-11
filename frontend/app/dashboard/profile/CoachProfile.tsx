"use client";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from "react";
import { fetchWithAuth } from "../../lib/api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import p from "./coach-profile.module.css";
export type Profile = {
  user: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    email: string;
    role: string;
    profile_image?: string | null;
  };
  details: {
    headline?: string;
    primary_sport?: string;
    location?: string;
    years_experience?: number | null;
    specialisms?: string;
    bio?: string;
  };
  counts: {
    teams: number;
    achievements: number;
    history: number;
    qualifications: number;
  };
};
type Section = "personal" | "coaching" | "about" | "photo";
async function request(body?: object): Promise<Profile> {
  const res = await fetchWithAuth(
    "/coach-profile",
    body ? { method: "PATCH", body: JSON.stringify(body) } : undefined,
  );
  if (!res) throw new Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to load or save your profile. Please try again.",
    );
  return data;
}
function remember(user: Profile["user"]) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    /* The server remains the source of truth if browser storage is full. */
  }
  window.dispatchEvent(new CustomEvent("profile-updated", { detail: user }));
}
const shown = (value?: string | number | null) =>
  value === 0 ? "0" : value || "Not added";
export default function CoachProfile() {
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState(""),
    [section, setSection] = useState<Section | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request()
      .then((data) => {
        if (active) {
          setProfile(data);
          remember(data.user);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  if (loading)
    return (
      <div className={s.workspace}>
        <p role="status" className={s.loading}>
          Loading your coaching profile…
        </p>
      </div>
    );
  if (!profile)
    return (
      <div className={s.workspace}>
        <h1>My profile</h1>
        <p role="alert" className={s.error}>
          {error}
        </p>
        <button className={s.primary} onClick={() => setRetry((n) => n + 1)}>
          Try again
        </button>
      </div>
    );
  const { user, details, counts } = profile;
  const name =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "Your name";
  const initials =
    [user.first_name, user.last_name]
      .filter(Boolean)
      .map((x) => x![0])
      .join("") || "C";
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <h1>My profile</h1>
          <p className={s.subtitle}>
            Your experience. Your approach. Your coaching story.
          </p>
        </div>
      </header>
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      <section className={p.hero} aria-label="Coach profile card">
        <div className={p.identity}>
          <button
            className={p.avatar}
            onClick={() => setSection("photo")}
            aria-label="Change profile photo"
          >
            {user.profile_image ? (
              <img src={user.profile_image} alt={`${name}'s profile`} />
            ) : (
              <span>{initials}</span>
            )}
            <small>Edit photo</small>
          </button>
          <div>
            <p className={p.kicker}>COACH</p>
            <h2>{name}</h2>
            <p className={p.headline}>
              {details.headline ||
                "Add your coaching role and make this profile your own."}
            </p>
            <div className={p.tags}>
              {details.primary_sport && <span>{details.primary_sport}</span>}
              {details.location && <span>{details.location}</span>}
              {details.years_experience != null && (
                <span>
                  {details.years_experience}{" "}
                  {details.years_experience === 1 ? "year" : "years"} coaching
                </span>
              )}
            </div>
          </div>
        </div>
        <button className={s.primary} onClick={() => setSection("coaching")}>
          Edit coaching details
        </button>
      </section>
      <div className={p.grid}>
        <section className={p.panel}>
          <div className={p.panelHead}>
            <h2>Personal details</h2>
            <button
              className={s.textButton}
              onClick={() => setSection("personal")}
              aria-label="Edit personal details"
            >
              Edit ↗
            </button>
          </div>
          <dl className={p.details}>
            <div>
              <dt>First name</dt>
              <dd>{shown(user.first_name)}</dd>
            </div>
            <div>
              <dt>Last name</dt>
              <dd>{shown(user.last_name)}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{shown(user.phone)}</dd>
            </div>
            <div>
              <dt>Sign-in email</dt>
              <dd>{user.email}</dd>
            </div>
          </dl>
          <p className={p.hint}>
            Your contact details are only available in your account.
          </p>
        </section>
        <section className={p.panel}>
          <div className={p.panelHead}>
            <h2>Coaching details</h2>
            <button
              className={s.textButton}
              onClick={() => setSection("coaching")}
              aria-label="Edit coaching details section"
            >
              Edit ↗
            </button>
          </div>
          <dl className={p.details}>
            <div>
              <dt>Coaching role</dt>
              <dd>{shown(details.headline)}</dd>
            </div>
            <div>
              <dt>Primary sport</dt>
              <dd>{shown(details.primary_sport)}</dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd>{shown(details.location)}</dd>
            </div>
            <div>
              <dt>Years coaching</dt>
              <dd>{shown(details.years_experience)}</dd>
            </div>
            <div>
              <dt>Specialisms</dt>
              <dd>{shown(details.specialisms)}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className={p.panel}>
        <div className={p.panelHead}>
          <h2>About my coaching</h2>
          <button
            className={s.textButton}
            onClick={() => setSection("about")}
            aria-label="Edit about my coaching"
          >
            {details.bio ? "Edit" : "Add"} ↗
          </button>
        </div>
        {details.bio ? (
          <p className={p.bio}>{details.bio}</p>
        ) : (
          <p className={p.empty}>
            What do you want your players to learn from you? Describe your
            approach, the athletes you work with and what matters to you as a
            coach.
          </p>
        )}
      </section>
      <section className={p.portfolio}>
        <div className={p.panelHead}>
          <h2>My coaching portfolio</h2>
        </div>
        <div className={p.portfolioGrid}>
          {(
            [
              {
                key: "teams",
                title: "Teams",
                hint: "Manage your current squads",
                href: "teams",
              },
              {
                key: "history",
                title: "Coaching history",
                hint: "Teams and roles over the years",
                href: "history",
              },
              {
                key: "achievements",
                title: "Achievements",
                hint: "Results, awards and milestones",
                href: "achievements",
              },
              {
                key: "qualifications",
                title: "Qualifications",
                hint: "Credentials and certificates",
                href: "qualifications",
              },
            ] as const
          ).map((item) => (
            <Link
              className={p.portfolioCard}
              key={item.key}
              href={`/dashboard/coaches/${item.href}`}
            >
              <span className={p.number}>
                {counts[item.key]}
                <span aria-hidden="true">↗</span>
              </span>
              <h3>{item.title}</h3>
              <p>{item.hint}</p>
            </Link>
          ))}
        </div>
      </section>
      {section && (
        <ProfileEditor
          key={section}
          section={section}
          profile={profile}
          close={() => setSection(null)}
          saved={(data) => {
            setProfile(data);
            remember(data.user);
            setSection(null);
            setNotice("Your profile has been updated.");
          }}
        />
      )}
    </div>
  );
}
function ProfileEditor({
  section,
  profile,
  close,
  saved,
}: {
  section: Section;
  profile: Profile;
  close: () => void;
  saved: (data: Profile) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [photo, setPhoto] = useState<string | null | undefined>(undefined),
    [reading, setReading] = useState(false);
  const generation = useRef(0);
  const title = {
    personal: "Edit personal details",
    coaching: "Edit coaching details",
    about: "About my coaching",
    photo: "Profile photo",
  }[section];
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      generation.current++;
      window.removeEventListener("beforeunload", warn);
    };
  }, [dirty]);
  function dismiss() {
    if (busy || reading) return;
    if (dirty) setDiscard(true);
    else close();
  }
  async function choosePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const version = ++generation.current;
    setError("");
    if (
      file.size > 2097152 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG or WebP photo up to 2 MB.");
      e.target.value = "";
      return;
    }
    setReading(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () =>
          reject(new Error("Unable to read the photo. Choose another image."));
        reader.readAsDataURL(file);
      });
      if (version === generation.current) {
        setPhoto(data);
        setDirty(true);
      }
    } catch (err) {
      if (version === generation.current) setError((err as Error).message);
    } finally {
      if (version === generation.current) setReading(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const values: Record<string, unknown> = Object.fromEntries(
      new FormData(e.currentTarget),
    );
    if (section === "coaching")
      values.years_experience =
        values.years_experience === "" ? null : Number(values.years_experience);
    if (section === "photo") {
      if (photo === undefined) return;
      values.profile_image = photo;
    }
    setBusy(true);
    try {
      saved(await request(values));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={title}
      description={
        section === "personal"
          ? "Keep your name and contact number up to date."
          : section === "photo"
            ? "Choose a clear head-and-shoulders photo."
            : section === "about"
              ? "Give your coaching approach a voice."
              : "Tell your coaching story at a glance."
      }
      close={dismiss}
    >
      <form
        className={s.form}
        onSubmit={submit}
        onChange={() => {
          if (section !== "photo") setDirty(true);
        }}
      >
        <fieldset className={p.fields} disabled={busy || reading}>
          {section === "personal" && (
            <>
              <div className={s.formRow}>
                <label>
                  First name
                  <input
                    name="first_name"
                    autoComplete="given-name"
                    required
                    maxLength={80}
                    defaultValue={profile.user.first_name}
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="last_name"
                    autoComplete="family-name"
                    required
                    maxLength={80}
                    defaultValue={profile.user.last_name}
                  />
                </label>
              </div>
              <label>
                Phone <span className={s.optional}>(optional)</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  defaultValue={profile.user.phone || ""}
                  placeholder="e.g. +27 82 123 4567"
                />
              </label>
              <label>
                Sign-in email
                <input
                  type="email"
                  value={profile.user.email}
                  readOnly
                  aria-describedby="email-help"
                />
              </label>
              <p id="email-help" className={s.formTip}>
                Email changes are not available here. This is the address used
                to sign in.
              </p>
            </>
          )}
          {section === "coaching" && (
            <>
              <label>
                Coaching role <span className={s.optional}>(optional)</span>
                <input
                  name="headline"
                  maxLength={120}
                  defaultValue={profile.details.headline}
                  placeholder="e.g. U18 head coach · Player development"
                />
              </label>
              <div className={s.formRow}>
                <label>
                  Primary sport
                  <input
                    name="primary_sport"
                    maxLength={80}
                    defaultValue={profile.details.primary_sport}
                    placeholder="e.g. Rugby"
                  />
                </label>
                <label>
                  Years of experience
                  <input
                    name="years_experience"
                    type="number"
                    min="0"
                    max="80"
                    step="1"
                    defaultValue={profile.details.years_experience ?? ""}
                  />
                </label>
              </div>
              <label>
                Based in
                <input
                  name="location"
                  maxLength={160}
                  defaultValue={profile.details.location}
                  placeholder="e.g. Pretoria, South Africa"
                />
              </label>
              <label>
                Specialisms
                <input
                  name="specialisms"
                  maxLength={240}
                  defaultValue={profile.details.specialisms}
                  placeholder="e.g. Forwards, defence, youth development"
                />
              </label>
              <p className={s.formTip}>
                These fields are optional. Add certificates and past teams in
                your coaching portfolio.
              </p>
            </>
          )}
          {section === "about" && (
            <>
              <label>
                My coaching philosophy
                <textarea
                  name="bio"
                  rows={7}
                  maxLength={2000}
                  defaultValue={profile.details.bio}
                  placeholder="My approach to coaching is…"
                />
              </label>
              <p className={s.formTip}>
                Up to 2,000 characters. Share your values, strengths and how you
                develop players.
              </p>
            </>
          )}
          {section === "photo" && (
            <>
              <div className={p.photoPreview}>
                {(photo === undefined ? profile.user.profile_image : photo) ? (
                  <img
                    src={
                      (photo === undefined
                        ? profile.user.profile_image
                        : photo)!
                    }
                    alt="Profile photo preview"
                  />
                ) : (
                  <span>{profile.user.first_name?.[0] || "C"}</span>
                )}
              </div>
              <label>
                Choose photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={choosePhoto}
                />
              </label>
              <p className={s.formTip}>JPG, PNG or WebP · Up to 2 MB</p>
              {(photo || profile.user.profile_image) && (
                <button
                  type="button"
                  className={s.textButton}
                  onClick={() => {
                    generation.current++;
                    setPhoto(null);
                    setDirty(true);
                  }}
                >
                  Remove photo
                </button>
              )}
            </>
          )}
        </fieldset>
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        {discard && (
          <div role="alert" className={p.discard}>
            <p>Discard your unsaved changes?</p>
            <button
              type="button"
              className={s.secondary}
              onClick={() => setDiscard(false)}
            >
              Keep editing
            </button>
            <button type="button" className={s.danger} onClick={close}>
              Discard changes
            </button>
          </div>
        )}
        <div className={s.formFooter}>
          <button
            type="button"
            className={s.secondary}
            disabled={busy || reading}
            onClick={dismiss}
          >
            Cancel
          </button>
          <button className={s.primary} disabled={busy || reading || !dirty}>
            {busy ? "Saving…" : reading ? "Reading photo…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
