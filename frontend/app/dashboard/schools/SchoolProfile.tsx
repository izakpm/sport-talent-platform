"use client";
import { FormEvent, useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";
import type { Workspace } from "./SchoolWorkspace";
import s from "./schools.module.css";
const fields = {
  name: "Organisation name",
  location: "Town / city",
  province: "Province",
  contact_person: "Contact person",
  email: "Contact email",
  phone: "Phone number",
  website: "Website",
  address: "Street / postal address",
  description: "About your school or club",
};
type Values = Record<keyof typeof fields | "type", string>;
const values = (school: NonNullable<Workspace["school"]>) =>
  Object.fromEntries(
    [...Object.keys(fields), "type"].map((k) => [
      k,
      (school as any)[k] || (k === "type" ? "SCHOOL" : ""),
    ]),
  ) as Values;
export default function SchoolProfile() {
  const [school, setSchool] = useState<Workspace["school"]>(null),
    [form, setForm] = useState<Values | null>(null),
    [editing, setEditing] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetchWithAuth("/schools/workspace")
      .then(async (r) => {
        if (!r?.ok) throw Error("Could not load your organisation.");
        const d = await r.json();
        if (active) {
          setSchool(d.school);
          if (d.school) setForm(values(d.school));
          else setError("No organisation is linked to this account.");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetchWithAuth("/schools/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      if (!r?.ok) {
        const d = await r?.json().catch(() => null);
        throw Error(
          typeof d?.message === "string"
            ? d.message
            : "Could not save your details. Please try again.",
        );
      }
      const updated = await r.json();
      setSchool(updated);
      setForm(values(updated));
      setEditing(false);
      setMessage("Organisation details saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save details.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.page}>
      <header>
        <p className={s.eyebrow}>Schools & sporting clubs</p>
        <h1>Profile</h1>
        <p className={s.muted}>
          Your organisation’s identity and contact details.
        </p>
      </header>
      {error && (
        <p role="alert" className={s.demo}>
          {error}
        </p>
      )}
      {message && (
        <p role="status" className={s.demo}>
          {message}
        </p>
      )}
      {!form && !error && <p role="status">Loading your profile…</p>}
      {school && form && (
        <>
          <section className={s.hero}>
            <div className={s.identity}>
              {school.logo_url && (
                <img src={school.logo_url} alt={`${school.name} crest`} />
              )}
              <div>
                <p className={s.kicker}>
                  {school.type === "CLUB" ? "Sporting club" : "School"}
                </p>
                <h2>{school.name}</h2>
                <p>
                  {[school.location, school.province]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </section>
          <form className={s.card} onSubmit={save}>
            <div className={s.sectionHeading}>
              <h2>Organisation details</h2>
              {!editing && school.can_edit_profile && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setMessage("");
                    setError("");
                  }}
                >
                  Edit details
                </button>
              )}
            </div>
            <fieldset className={s.profileFields} disabled={!editing || busy}>
              <label>
                Organisation type
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="SCHOOL">School</option>
                  <option value="CLUB">Sporting club</option>
                </select>
              </label>
              {Object.entries(fields).map(([key, label]) => (
                <label
                  key={key}
                  className={
                    key === "description" || key === "address"
                      ? s.wideField
                      : undefined
                  }
                >
                  {label}
                  {key === "description" || key === "address" ? (
                    <textarea
                      rows={key === "description" ? 4 : 2}
                      maxLength={key === "description" ? 2000 : 500}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      required={key === "name"}
                      type={
                        key === "email"
                          ? "email"
                          : key === "website"
                            ? "url"
                            : key === "phone"
                              ? "tel"
                              : "text"
                      }
                      maxLength={key === "website" ? 500 : 160}
                      value={form[key as keyof Values]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  )}
                </label>
              ))}
            </fieldset>
            <p className={s.muted}>
              Contact email is for your organisation. Updating it does not
              change your account login.
            </p>
            {editing && (
              <div className={s.links}>
                <button disabled={busy} type="submit">
                  {busy ? "Saving…" : "Save changes"}
                </button>
                <button
                  disabled={busy}
                  type="button"
                  onClick={() => {
                    setForm(values(school));
                    setEditing(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
            {!school.can_edit_profile && (
              <p className={s.muted}>
                Only authorised organisation administrators can update these
                details.
              </p>
            )}
          </form>
          {school.is_demo && (
            <p className={s.demo}>
              Demonstration workspace · Changes are saved to this demo
              organisation.
            </p>
          )}
        </>
      )}
    </div>
  );
}
