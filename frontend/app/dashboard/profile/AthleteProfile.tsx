"use client";
import { childContext, selectChild } from "../../lib/guardian-context";
import { useSectionHash } from "../core/useSectionHash";
import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { fetchWithAuth } from "../../lib/api";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import p from "./coach-profile.module.css";
import a from "./athlete-profile.module.css";
type Entry = {
  id: string;
  kind: "achievement" | "metric";
  title: string;
  date: string;
  organization: string;
  notes: string;
  value: number | null;
  unit: string | null;
};
type Sport = {
  sport_id: string;
  sport_name: string;
  position_id: string;
  position_name: string;
  primary_position: boolean;
  is_primary: boolean;
};
type Profile = {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    role: string;
    profile_image?: string | null;
  };
  details: { nationality?: string; province?: string; bio?: string };
  sports: Sport[];
  entries: Entry[];
  catalog: {
    sports: { id: string; name: string }[];
    positions: { id: string; name: string; sport_id: string }[];
    metrics: Record<string, string>;
  };
};
type Editor = {
  kind: "personal" | "photo" | "sport" | "achievement" | "metric";
  sport?: string;
  entry?: Entry;
};
async function request(
  path = "",
  method = "GET",
  body?: object,
): Promise<Profile> {
  const res = await fetchWithAuth("/athlete-profile" + path, {
    method,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res) throw new Error("Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to save. Please try again.",
    );
  return data;
}
const shown = (v?: string) => v || "Not added";
export default function AthleteProfile({
  initialTab = "details",
}: {
  initialTab?: string;
}) {
  const [tab, setTab] = useSectionHash(
    ["details", "sports", "achievement", "metric"],
    initialTab,
  );
  const [profile, setProfile] = useState<Profile | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0),
    [editor, setEditor] = useState<Editor | null>(null),
    [remove, setRemove] = useState<Entry | null>(null),
    [busy, setBusy] = useState(false);
  function saved(data: Profile) {
    setProfile(data);
    const child = childContext();
    if (child) {
      selectChild({
        ...child,
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        profile_image: data.user.profile_image,
      });
      return;
    }
    try {
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch {}
    window.dispatchEvent(
      new CustomEvent("profile-updated", { detail: data.user }),
    );
  }
  useEffect(() => {
    let active = true;
    setError("");
    request()
      .then((data) => {
        if (active) saved(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [retry]);
  async function deleteEntry() {
    if (!remove) return;
    setBusy(true);
    try {
      saved(await request("/entries/" + remove.id, "DELETE"));
      setRemove(null);
      setNotice("Record removed.");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!profile)
    return (
      <div className={s.workspace}>
        {error ? (
          <p role="alert">
            {error}{" "}
            <button onClick={() => setRetry((n) => n + 1)}>Try again</button>
          </p>
        ) : (
          <p role="status">Loading your sporting profile…</p>
        )}
      </div>
    );
  const { user, details, sports, entries } = profile;
  const sportIds = [...new Set(sports.map((v) => v.sport_id))];
  const main =
    sports.find((v) => v.is_primary && v.primary_position) ||
    sports.find((v) => v.is_primary) ||
    sports[0];
  return (
    <div className={s.workspace}>
      <header className={a.heading}>
        <div>
          <p className={a.eyebrow}>MY SPORTING PROFILE</p>
          <h1>The work. The progress. You.</h1>
          <p>Build a record of the athlete you are becoming.</p>
        </div>
      </header>
      {error && (
        <p role="alert" className={s.formError}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={a.notice}>
          {notice}
        </p>
      )}
      <section className={`${p.hero} ${a.hero}`}>
        <div className={p.identity}>
          <button
            className={p.avatar}
            aria-label="Change profile photo"
            onClick={() => setEditor({ kind: "photo" })}
          >
            {user.profile_image ? (
              <img src={user.profile_image} alt="Your profile photo" />
            ) : (
              [user.first_name, user.last_name].map((n) => n?.[0]).join("")
            )}
            <small>Change photo</small>
          </button>
          <div>
            <p className={p.kicker}>YOUR SPORTING STORY</p>
            <h2>
              {user.first_name} {user.last_name}
            </h2>
            <p className={p.headline}>
              {main
                ? `${main.sport_name}${main.primary_position ? " · " + main.position_name : ""}`
                : "Add your sport and playing positions"}
            </p>
            <div className={p.tags}>
              {details.province && <span>{details.province}</span>}
              <span>
                {entries.filter((e) => e.kind === "achievement").length}{" "}
                achievements
              </span>
              <span>
                {entries.filter((e) => e.kind === "metric").length} performance
                records
              </span>
            </div>
          </div>
        </div>
        <button
          className={s.primary}
          onClick={() => setEditor({ kind: "personal" })}
        >
          Edit my details ↗
        </button>
      </section>
      <nav className={a.tabs} aria-label="Profile sections">
        {[
          ["details", "My details"],
          ["sports", "Sports & positions"],
          ["achievement", "Achievements"],
          ["metric", "Performance metrics"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === "details" && (
        <div className={a.grid}>
          <section className={p.panel}>
            <div className={p.panelHead}>
              <h2>Personal details</h2>
              <button
                className={s.textButton}
                onClick={() => setEditor({ kind: "personal" })}
              >
                Edit ↗
              </button>
            </div>
            <dl className={p.details}>
              {[
                ["First name", user.first_name],
                ["Last name", user.last_name],
                [
                  "Sign-in email",
                  childContext()
                    ? "Managed by parent — no email required"
                    : user.email,
                ],
                ["Phone", user.phone],
                ["Nationality", details.nationality],
                ["Province / region", details.province],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{shown(value)}</dd>
                </div>
              ))}
            </dl>
            <p className={p.hint}>Your sign-in email is kept unchanged here.</p>
          </section>
          <section className={p.panel}>
            <div className={p.panelHead}>
              <h2>About me</h2>
              <button
                className={s.textButton}
                onClick={() => setEditor({ kind: "personal" })}
              >
                Edit ↗
              </button>
            </div>
            <p className={p.bio}>
              {details.bio ||
                "What drives you? Tell your sporting story, what you are working towards and what you bring to your team."}
            </p>
          </section>
        </div>
      )}
      {tab === "sports" && (
        <section className={p.panel}>
          <div className={p.panelHead}>
            <h2>Where I play</h2>
            <button
              className={s.primary}
              onClick={() => setEditor({ kind: "sport" })}
            >
              Add sport +
            </button>
          </div>
          <p className={p.hint}>
            Choose your primary sport, your main position and the other
            positions you play.
          </p>
          {!sportIds.length && (
            <p className={p.empty}>
              Add your first sport to start building your playing profile.
            </p>
          )}
          {sportIds.map((id) => {
            const rows = sports.filter((v) => v.sport_id === id);
            return (
              <article className={a.record} key={id}>
                <div>
                  <h3>{rows[0].sport_name}</h3>
                  {rows.some((v) => v.is_primary) && (
                    <span className={a.badge}>Primary sport</span>
                  )}
                  <p>
                    {rows
                      .map(
                        (v) =>
                          v.position_name +
                          (v.primary_position ? " (primary)" : ""),
                      )
                      .join(" · ")}
                  </p>
                </div>
                <button
                  className={s.secondary}
                  onClick={() => setEditor({ kind: "sport", sport: id })}
                >
                  Edit positions
                </button>
              </article>
            );
          })}
        </section>
      )}
      {(tab === "achievement" || tab === "metric") && (
        <section className={p.panel}>
          <div className={p.panelHead}>
            <h2>
              {tab === "achievement"
                ? "Milestones worth remembering"
                : "Measure your progress"}
            </h2>
            <button
              className={s.primary}
              onClick={() => setEditor({ kind: tab })}
            >
              {tab === "achievement" ? "Add achievement +" : "Record result +"}
            </button>
          </div>
          <p className={p.hint}>
            {tab === "achievement"
              ? "Add team selections, awards and competition results."
              : "Record each test with its date. Add testing conditions or repetitions in the notes so results can be compared fairly."}{" "}
            These records are self-reported, not coach-verified.
          </p>
          {!entries.some((e) => e.kind === tab) && (
            <p className={p.empty}>
              {tab === "achievement"
                ? "Your selections, awards and milestones belong here. Add your first achievement."
                : "Start with a benchmark: bench press, squat, sprint time or another available test."}
            </p>
          )}
          {entries
            .filter((e) => e.kind === tab)
            .map((e) => (
              <article className={a.record} key={e.id}>
                <div>
                  <span className={a.badge}>Self-reported</span>
                  <h3>
                    {e.title}
                    {e.kind === "metric" && (
                      <span className={a.result}>
                        {" "}
                        {e.value} <small>{e.unit}</small>
                      </span>
                    )}
                  </h3>
                  <p>
                    {new Date(e.date + "T12:00:00").toLocaleDateString(
                      "en-ZA",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                    {e.organization ? " · " + e.organization : ""}
                  </p>
                  {e.notes && <p className={a.notes}>{e.notes}</p>}
                </div>
                <div className={a.actions}>
                  <button
                    className={s.secondary}
                    aria-label={`Edit ${e.title}`}
                    onClick={() => setEditor({ kind: e.kind, entry: e })}
                  >
                    Edit
                  </button>
                  <button
                    className={s.textButton}
                    aria-label={`Remove ${e.title}`}
                    onClick={() => {
                      setError("");
                      setRemove(e);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
        </section>
      )}
      {editor && (
        <ProfileEditor
          profile={profile}
          editor={editor}
          close={() => setEditor(null)}
          saved={(data) => {
            saved(data);
            setEditor(null);
            setNotice("Your profile has been updated.");
            setError("");
          }}
        />
      )}
      {remove && (
        <Modal
          title="Remove this record?"
          description={`This will remove “${remove.title}” from your portfolio.`}
          close={() => {
            if (!busy) setRemove(null);
          }}
        >
          {error && (
            <p role="alert" className={s.formError}>
              {error}
            </p>
          )}
          <div className={s.formFooter}>
            <button
              className={s.secondary}
              disabled={busy}
              onClick={() => setRemove(null)}
            >
              Keep record
            </button>
            <button className={s.primary} disabled={busy} onClick={deleteEntry}>
              {busy ? "Removing…" : "Remove record"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function ProfileEditor({
  profile,
  editor,
  close,
  saved,
}: {
  profile: Profile;
  editor: Editor;
  close: () => void;
  saved: (p: Profile) => void;
}) {
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [photo, setPhoto] = useState<string | null | undefined>(undefined),
    [sport, setSport] = useState(editor.sport || ""),
    [positions, setPositions] = useState(
      profile.sports
        .filter((v) => v.sport_id === editor.sport)
        .map((v) => v.position_id),
    ),
    [primary, setPrimary] = useState(
      profile.sports.find(
        (v) => v.sport_id === editor.sport && v.primary_position,
      )?.position_id || "",
    ),
    [metric, setMetric] = useState(editor.entry?.title || "Bench press");
  const isEntry = editor.kind === "achievement" || editor.kind === "metric";
  const title =
    editor.kind === "personal"
      ? "Edit personal details"
      : editor.kind === "photo"
        ? "Update profile photo"
        : editor.kind === "sport"
          ? "Sports & positions"
          : `${editor.entry ? "Edit" : "Add"} ${editor.kind === "metric" ? "performance result" : "achievement"}`;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const f = new FormData(event.currentTarget);
    let body: object,
      path = "",
      method = "PATCH";
    if (editor.kind === "personal")
      body = Object.fromEntries(
        [
          "first_name",
          "last_name",
          "phone",
          "nationality",
          "province",
          "bio",
        ].map((k) => [k, f.get(k) || ""]),
      );
    else if (editor.kind === "photo") {
      if (photo === undefined) {
        setError("Choose a photo or remove your current one.");
        return;
      }
      body = { profile_image: photo };
    } else if (editor.kind === "sport") {
      if (!positions.length) {
        setError("Choose at least one position.");
        return;
      }
      body = {
        sport_id: sport,
        position_ids: positions,
        primary_position_id: primary,
        is_primary: f.get("is_primary") === "on",
      };
      path = "/sport";
      method = "PUT";
    } else {
      body = {
        kind: editor.kind,
        title: editor.kind === "metric" ? metric : f.get("title"),
        date: f.get("date"),
        organization: f.get("organization") || "",
        notes: f.get("notes") || "",
        ...(editor.kind === "metric" ? { value: Number(f.get("value")) } : {}),
      };
      path = "/entries" + (editor.entry ? "/" + editor.entry.id : "");
      method = editor.entry ? "PATCH" : "POST";
    }
    setBusy(true);
    try {
      saved(await request(path, method, body));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function choosePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2097152
    ) {
      setError("Choose a JPG, PNG or WebP image up to 2 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPhoto(String(reader.result));
    reader.onerror = () =>
      setError("Unable to read this image. Please choose another.");
    reader.readAsDataURL(file);
  }
  return (
    <Modal
      title={title}
      description="Save your changes when you’re ready."
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <fieldset disabled={busy} className={a.fieldset}>
          {editor.kind === "personal" && (
            <>
              {[
                ["first_name", "First name", 80],
                ["last_name", "Last name", 80],
                ["phone", "Phone", 40],
                ["nationality", "Nationality", 80],
                ["province", "Province / region", 100],
              ].map(([key, label, max]) => (
                <label key={key}>
                  {label}
                  <input
                    name={String(key)}
                    maxLength={Number(max)}
                    type={key === "phone" ? "tel" : "text"}
                    required={key === "first_name" || key === "last_name"}
                    defaultValue={String(
                      (profile.user as any)[key] ??
                        (profile.details as any)[key] ??
                        "",
                    )}
                  />
                </label>
              ))}
              <label>
                About me
                <textarea
                  name="bio"
                  maxLength={2000}
                  rows={5}
                  defaultValue={profile.details.bio || ""}
                />
              </label>
            </>
          )}
          {editor.kind === "photo" && (
            <>
              {(photo === undefined ? profile.user.profile_image : photo) && (
                <img
                  className={a.preview}
                  src={
                    (photo === undefined
                      ? profile.user.profile_image
                      : photo) || ""
                  }
                  alt="Profile photo preview"
                />
              )}
              <label>
                Choose photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={choosePhoto}
                />
              </label>
              <p className={s.formTip}>JPG, PNG or WebP · up to 2 MB</p>
              <button
                type="button"
                className={s.secondary}
                onClick={() => setPhoto(null)}
              >
                Remove photo
              </button>
            </>
          )}
          {editor.kind === "sport" && (
            <>
              <label>
                Sport
                <select
                  required
                  disabled={!!editor.sport}
                  value={sport}
                  onChange={(e) => {
                    setSport(e.target.value);
                    setPositions([]);
                    setPrimary("");
                  }}
                >
                  <option value="">Choose sport</option>
                  {profile.catalog.sports
                    .filter(
                      (v) =>
                        v.id === editor.sport ||
                        !profile.sports.some((s) => s.sport_id === v.id),
                    )
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </label>
              <fieldset className={a.choices}>
                <legend>Positions you play</legend>
                {profile.catalog.positions
                  .filter((v) => v.sport_id === sport)
                  .map((v) => (
                    <label key={v.id}>
                      <input
                        type="checkbox"
                        checked={positions.includes(v.id)}
                        onChange={(e) => {
                          setPositions((old) =>
                            e.target.checked
                              ? [...old, v.id]
                              : old.filter((id) => id !== v.id),
                          );
                          if (!e.target.checked && primary === v.id)
                            setPrimary("");
                        }}
                      />
                      {v.name}
                    </label>
                  ))}
                {sport &&
                  !profile.catalog.positions.some(
                    (v) => v.sport_id === sport,
                  ) && <p>No positions are available for this sport yet.</p>}
              </fieldset>
              <label>
                Primary position
                <select
                  required
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                >
                  <option value="">Choose main position</option>
                  {profile.catalog.positions
                    .filter((v) => positions.includes(v.id))
                    .map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_primary"
                  defaultChecked={
                    profile.sports.some(
                      (v) => v.sport_id === editor.sport && v.is_primary,
                    ) || !profile.sports.length
                  }
                />
                My primary sport
              </label>
            </>
          )}
          {isEntry && (
            <>
              {editor.kind === "metric" ? (
                <>
                  <label>
                    Metric
                    <select
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                    >
                      {Object.keys(profile.catalog.metrics).map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Result ({profile.catalog.metrics[metric]})
                    <input
                      type="number"
                      required
                      min="0.01"
                      max="10000"
                      step="0.01"
                      name="value"
                      defaultValue={editor.entry?.value ?? ""}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Achievement
                    <input
                      required
                      name="title"
                      maxLength={160}
                      placeholder="e.g. Blue Bulls U15 Invitational Team"
                      defaultValue={editor.entry?.title || ""}
                    />
                  </label>
                  <label>
                    School, club or competition
                    <input
                      name="organization"
                      maxLength={160}
                      defaultValue={editor.entry?.organization || ""}
                    />
                  </label>
                </>
              )}
              <label>
                {editor.kind === "metric" ? "Test date" : "Achievement date"}
                <input
                  required
                  name="date"
                  type="date"
                  min="1900-01-01"
                  max={new Date().toLocaleDateString("en-CA", {
                    timeZone: "Africa/Johannesburg",
                  })}
                  defaultValue={editor.entry?.date || ""}
                />
              </label>
              <label>
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  maxLength={1500}
                  placeholder={
                    editor.kind === "metric"
                      ? "e.g. 3 repetitions, test conditions or technique used"
                      : "Add a little context"
                  }
                  defaultValue={editor.entry?.notes || ""}
                />
              </label>
              <p className={s.formTip}>
                Saved as self-reported. This does not create a verified result.
              </p>
            </>
          )}
        </fieldset>
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        {editor.kind === "sport" && editor.sport && (
          <div>
            {confirmRemoval && (
              <p className={s.formTip}>
                Remove this sport and its playing positions? Your achievements
                and metric records will be kept.
              </p>
            )}
            <button
              type="button"
              className={s.textButton}
              disabled={busy}
              onClick={async () => {
                if (!confirmRemoval) {
                  setConfirmRemoval(true);
                  return;
                }
                setBusy(true);
                setError("");
                try {
                  saved(
                    await request("/sport", "PUT", {
                      sport_id: editor.sport,
                      position_ids: [],
                      primary_position_id: "",
                      is_primary: false,
                    }),
                  );
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {confirmRemoval ? "Confirm removal of sport" : "Remove sport"}
            </button>
            {confirmRemoval && (
              <button
                type="button"
                className={s.textButton}
                disabled={busy}
                onClick={() => setConfirmRemoval(false)}
              >
                Keep sport
              </button>
            )}
          </div>
        )}
        <div className={s.formFooter}>
          <button
            type="button"
            disabled={busy}
            className={s.secondary}
            onClick={close}
          >
            Cancel
          </button>
          <button type="submit" disabled={busy} className={s.primary}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
