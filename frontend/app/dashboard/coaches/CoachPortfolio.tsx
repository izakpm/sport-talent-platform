"use client";
import { useEffect, useState, type FormEvent } from "react";
import { fetchWithAuth } from "../../lib/api";
import { Modal } from "./CoachWorkspace";
import { todayDate } from "./planning";
import s from "./workspace.module.css";
import p from "./portfolio.module.css";
export type Kind = "achievements" | "history" | "qualifications";
type Entry = {
  id: string;
  title: string;
  organization: string;
  role: string;
  notes: string;
  start_date: string;
  end_date: string | null;
  certificate_name: string | null;
};
const labels = {
  achievements: {
    title: "Achievements",
    singular: "achievement",
    intro: "The milestones that tell your coaching story.",
    empty: "Celebrate your first milestone.",
    hint: "Record tournament results, awards and the moments you helped a team achieve more.",
    field: "Achievement",
    start: "Date achieved",
    end: "",
    placeholder: "e.g. League champions",
  },
  history: {
    title: "Coaching history",
    singular: "coaching role",
    intro: "Every team. Every season. Your experience, in one place.",
    empty: "Where has your coaching taken you?",
    hint: "Add the teams you have coached, your role and when you were part of the setup.",
    field: "Team",
    start: "Start date",
    end: "End date",
    placeholder: "e.g. First XV · U18",
  },
  qualifications: {
    title: "Qualifications",
    singular: "qualification",
    intro: "Your coaching credentials, ready when you need them.",
    empty: "Build your coaching credentials.",
    hint: "Add your Level 1 coaching, BokSmart or other qualifications and keep the certificates together.",
    field: "Qualification",
    start: "Issue date",
    end: "Expiry date",
    placeholder: "e.g. Level 1 coaching",
  },
};
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`/coach-portfolio${path}`, options);
  if (!res) throw new Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to save. Please try again.",
    );
  return data;
}
const dateLabel = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export default function CoachPortfolio({
  kind,
  embedded = false,
}: {
  kind: Kind;
  embedded?: boolean;
}) {
  const copy = labels[kind];
  const [entries, setEntries] = useState<Entry[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState<Entry | "new" | null>(null),
    [removing, setRemoving] = useState<Entry | null>(null),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    request<Entry[]>(`/${kind}`)
      .then((data) => {
        if (active) setEntries(data);
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
  }, [kind, retry]);
  async function download(entry: Entry) {
    setError("");
    try {
      const res = await fetchWithAuth(
        `/coach-portfolio/certificate/${entry.id}`,
      );
      if (!res?.ok)
        throw new Error(
          "Unable to download the certificate. Please try again.",
        );
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = entry.certificate_name || "certificate";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function remove() {
    if (!removing) return;
    setBusy(true);
    setError("");
    try {
      await request(`/${removing.id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== removing.id));
      setRemoving(null);
      setNotice("Record removed.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={embedded ? undefined : s.workspace}>
      {!embedded && (
        <div className={s.topline}>
          <span className={s.eyebrow}>MY COACHING PORTFOLIO</span>
        </div>
      )}
      <header className={s.header}>
        <div>
          {embedded ? <h2>{copy.title}</h2> : <h1>{copy.title}</h1>}
          <p className={s.subtitle}>{copy.intro}</p>
        </div>
        <button className={s.primary} onClick={() => setEditor("new")}>
          + Add {copy.singular}
        </button>
      </header>
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {error && !removing && (
        <div className={s.error} role="alert">
          {error}{" "}
          <button
            className={s.textButton}
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className={s.loading} role="status">
          Loading your {copy.title.toLowerCase()}…
        </p>
      ) : !error && !entries.length ? (
        <section className={s.empty}>
          <div className={s.emptyIcon} aria-hidden="true">
            {kind === "achievements" ? "★" : kind === "history" ? "↗" : "▧"}
          </div>
          <h2>{copy.empty}</h2>
          <p>{copy.hint}</p>
          <button className={s.primary} onClick={() => setEditor("new")}>
            Add {copy.singular}
          </button>
        </section>
      ) : (
        <div className={p.list}>
          {entries.map((entry) => {
            const expired =
              kind === "qualifications" &&
              entry.end_date &&
              entry.end_date < todayDate();
            return (
              <article className={p.card} key={entry.id}>
                <div className={p.mark} aria-hidden="true">
                  {kind === "achievements"
                    ? "★"
                    : kind === "history"
                      ? "↗"
                      : "▧"}
                </div>
                <div className={p.body}>
                  <div className={p.title}>
                    <h2>{entry.title}</h2>
                    {kind === "history" && !entry.end_date && (
                      <span className={p.badge}>Current role</span>
                    )}
                    {kind === "qualifications" && entry.end_date && (
                      <span className={expired ? p.expired : p.badge}>
                        {expired ? "Expired" : "Expires"} ·{" "}
                        {dateLabel(entry.end_date)}
                      </span>
                    )}
                  </div>
                  <p className={p.organization}>
                    {[entry.role, entry.organization]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className={p.date}>
                    {kind === "qualifications" ? "Issued " : ""}
                    {dateLabel(entry.start_date)}
                    {kind === "history"
                      ? ` — ${entry.end_date ? dateLabel(entry.end_date) : "Present"}`
                      : ""}
                  </p>
                  {entry.notes && <p className={p.notes}>{entry.notes}</p>}
                  {entry.certificate_name && (
                    <button className={p.file} onClick={() => download(entry)}>
                      ↓ {entry.certificate_name}
                    </button>
                  )}
                </div>
                <div className={p.actions}>
                  <button
                    className={s.secondary}
                    onClick={() => setEditor(entry)}
                  >
                    Edit
                  </button>
                  <button
                    className={s.textButton}
                    onClick={() => {
                      setError("");
                      setRemoving(entry);
                    }}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editor && (
        <Editor
          kind={kind}
          entry={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
          saved={(entry) => {
            setEntries((prev) =>
              [...prev.filter((e) => e.id !== entry.id), entry].sort((a, b) =>
                b.start_date.localeCompare(a.start_date),
              ),
            );
            setEditor(null);
            setNotice(
              `${copy.title === "Coaching history" ? "Coaching role" : copy.field} saved.`,
            );
            setError("");
          }}
        />
      )}
      {removing && (
        <Modal
          title={`Remove ${copy.singular}?`}
          description={removing.title}
          close={() => {
            if (!busy) setRemoving(null);
          }}
        >
          <p>
            This removes the record
            {removing.certificate_name ? " and its certificate" : ""} from your
            portfolio.
          </p>
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          <div className={s.formFooter}>
            <button
              className={s.secondary}
              disabled={busy}
              onClick={() => setRemoving(null)}
            >
              Cancel
            </button>
            <button className={s.danger} disabled={busy} onClick={remove}>
              {busy ? "Removing…" : "Remove record"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Editor({
  kind,
  entry,
  close,
  saved,
}: {
  kind: Kind;
  entry?: Entry;
  close: () => void;
  saved: (e: Entry) => void;
}) {
  const copy = labels[kind];
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [removeFile, setRemoveFile] = useState(false),
    [openEnded, setOpenEnded] = useState(!entry?.end_date);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      let certificate;
      if (file) {
        if (file.size > 2 * 1024 * 1024)
          throw new Error("Choose a certificate up to 2 MB.");
        const encoded = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.onerror = () => reject(new Error("Unable to read that file."));
          reader.readAsDataURL(file);
        });
        certificate = { name: file.name, data: encoded };
      }
      const result = await request<Entry>(
        `/${kind}${entry ? `/${entry.id}` : ""}`,
        {
          method: entry ? "PATCH" : "POST",
          body: JSON.stringify({
            ...data,
            end_date: openEnded ? null : data.end_date,
            certificate,
            remove_certificate: removeFile,
          }),
        },
      );
      saved(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${entry ? "Edit" : "Add"} ${copy.singular}`}
      description={
        kind === "qualifications"
          ? "Certificates are private to your account. Uploads are not automatically verified."
          : "Build a clear record of your coaching journey."
      }
      close={() => {
        if (!busy) close();
      }}
    >
      <form className={s.form} onSubmit={submit}>
        <label>
          {copy.field}
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={entry?.title}
            placeholder={copy.placeholder}
          />
        </label>
        <label>
          {kind === "qualifications"
            ? "Issuing body"
            : "School, club or organisation"}
          <input
            name="organization"
            maxLength={160}
            defaultValue={entry?.organization}
            placeholder={
              kind === "qualifications"
                ? "e.g. SA Rugby"
                : "e.g. Pretoria Rugby Club"
            }
          />
        </label>
        {kind === "history" && (
          <label>
            Coaching role
            <input
              name="role"
              required
              maxLength={100}
              defaultValue={entry?.role}
              placeholder="e.g. Head coach"
            />
          </label>
        )}
        <div className={s.formRow}>
          <label>
            {copy.start}
            <input
              name="start_date"
              type="date"
              required
              defaultValue={entry?.start_date}
            />
          </label>
          {kind !== "achievements" && (
            <label>
              {copy.end}
              <input
                name="end_date"
                type="date"
                required={!openEnded}
                disabled={openEnded}
                defaultValue={entry?.end_date || ""}
              />
            </label>
          )}
        </div>
        {kind !== "achievements" && (
          <label className={s.checkboxLabel}>
            <input
              type="checkbox"
              checked={openEnded}
              onChange={(e) => setOpenEnded(e.target.checked)}
            />
            <span>
              {kind === "history"
                ? "I currently coach this team"
                : "No expiry date"}
            </span>
          </label>
        )}
        <label>
          Details <span className={s.optional}>(optional)</span>
          <textarea
            name="notes"
            maxLength={2000}
            rows={3}
            defaultValue={entry?.notes}
            placeholder={
              kind === "history"
                ? "Responsibilities and highlights from your time with this team"
                : "Add any useful details"
            }
          />
        </label>
        {kind === "qualifications" && (
          <div className={p.upload}>
            <label>
              {entry?.certificate_name
                ? "Replace certificate"
                : "Upload certificate"}{" "}
              <span className={s.optional}>(optional)</span>
              <input
                aria-label="Certificate file"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setRemoveFile(false);
                }}
              />
            </label>
            <p className={s.formTip}>PDF, JPG or PNG · Up to 2 MB</p>
            {entry?.certificate_name && !file && (
              <label className={s.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={removeFile}
                  onChange={(e) => setRemoveFile(e.target.checked)}
                />
                <span>Remove {entry.certificate_name}</span>
              </label>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className={s.formError}>
            {error}
          </p>
        )}
        <div className={s.formFooter}>
          <button
            type="button"
            className={s.secondary}
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={s.primary} disabled={busy}>
            {busy ? "Saving…" : `Save ${copy.singular}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
