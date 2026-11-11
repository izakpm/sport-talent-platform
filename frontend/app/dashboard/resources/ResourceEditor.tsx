"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import { resources, Resource, topics, formats, uploadFile } from "./api";
import ResourceViewer from "./ResourceViewer";
import s from "./resources.module.css";
import w from "../coaches/workspace.module.css";
const blank = {
  title: "",
  summary: "",
  topic: "mindset",
  format: "video",
  author: "",
  duration_minutes: "",
  body: "",
  transcript: "",
  source_url: "",
};
type Fields = typeof blank;
function fields(r: Resource): Fields {
  return {
    ...blank,
    ...Object.fromEntries(
      Object.keys(blank).map((k) => [k, (r as any)[k] ?? ""]),
    ),
    duration_minutes: r.duration_minutes ? String(r.duration_minutes) : "",
  };
}
export default function ResourceEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Resource | null>(null),
    [form, setForm] = useState<Fields>(blank),
    [loaded, setLoaded] = useState(false),
    [allowed, setAllowed] = useState(false),
    [storage, setStorage] = useState(false),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    setError("");
    (async () => {
      try {
        const c = await resources<{
          can_publish: boolean;
          uploads_configured: boolean;
        }>("/capabilities");
        if (!c.can_publish)
          throw new Error("Resource publishing access is required.");
        const row =
          id === "new" ? null : await resources<Resource>(`/admin/${id}`);
        if (active) {
          setAllowed(true);
          setStorage(c.uploads_configured);
          setItem(row);
          setForm(row ? fields(row) : blank);
          setDirty(false);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, retry]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || busy) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  function change(key: keyof Fields, value: string) {
    setForm((old) => ({ ...old, [key]: value }));
    setDirty(true);
    setNotice("");
  }
  function remember(row: Resource) {
    setItem(row);
    setForm(fields(row));
    setDirty(false);
  }
  async function persist() {
    if (item && !dirty) return item;
    const row = await resources<Resource>(
      `/admin${item ? `/${item.id}` : ""}`,
      item ? "PATCH" : "POST",
      { ...form, version: item?.version },
    );
    remember(row);
    return row;
  }
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }
  async function save() {
    await run(async () => {
      const row = await persist();
      setNotice(
        row.status === "published"
          ? "Published resource updated."
          : "Draft saved. Athletes cannot see it yet.",
      );
      if (id === "new") router.replace(`/dashboard/resources-admin/${row.id}`);
    });
  }
  async function transition(action: string) {
    await run(async () => {
      const row = action === "publish" ? await persist() : item;
      if (!row) return;
      const next = await resources<Resource>(
        `/admin/${row.id}/publish`,
        "POST",
        { action, version: row.version },
      );
      remember(next);
      setNotice(
        action === "publish"
          ? "Published. Athletes can now access this resource."
          : action === "feature"
            ? "Featured resource updated."
            : action === "unpublish"
              ? "Unpublished. This resource is now a private draft."
              : action === "archive"
                ? "Resource archived."
                : "Resource updated.",
      );
      if (id === "new") router.replace(`/dashboard/resources-admin/${row.id}`);
    });
  }
  async function upload(purpose: string, e: ChangeEvent<HTMLInputElement>) {
    let file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (purpose === "captions" && file.name.toLowerCase().endsWith(".vtt"))
      file = new File([file], file.name, { type: "text/vtt" });
    const selected = file;
    await run(async () => {
      const row = await persist();
      const ticket = await resources<{ id: string; url: string }>(
        `/admin/${row.id}/uploads`,
        "POST",
        {
          purpose,
          name: selected.name,
          mime: selected.type,
          size: selected.size,
        },
      );
      setProgress(0);
      await uploadFile(ticket.url, selected, setProgress);
      const next = await resources<Resource>(
        `/admin/${row.id}/uploads/${ticket.id}/complete`,
        "POST",
        { version: row.version },
      );
      remember(next);
      setNotice("File uploaded and attached to this draft.");
      if (id === "new") router.replace(`/dashboard/resources-admin/${row.id}`);
    });
  }
  async function remove(purpose: string) {
    await run(async () => {
      if (!item) return;
      remember(
        await resources<Resource>(`/admin/${item.id}/detach`, "POST", {
          purpose,
          version: item.version,
        }),
      );
      setNotice("File removed from this draft.");
    });
  }
  const archived = item?.status === "archived",
    published = item?.status === "published";
  return (
    <div className={s.page}>
      <Link
        className={s.back}
        href="/dashboard/resources-admin"
        onClick={(e) => {
          if (
            busy ||
            (dirty && !window.confirm("Leave without saving your changes?"))
          )
            e.preventDefault();
        }}
      >
        ← Back to resource library
      </Link>
      <header className={s.heading}>
        <div>
          <p className={s.eyebrow}>PUBLISHING DESK</p>
          <h1>{id === "new" ? "Create a resource" : "Edit resource"}</h1>
          <p>Save your draft, preview the athlete experience, then publish.</p>
        </div>
        {item && (
          <span className={s.status}>
            {item.status}
            {item.featured ? " · Featured" : ""}
          </span>
        )}
      </header>
      {error && (
        <div role="alert" className={s.error}>
          {error}{" "}
          {!loaded || !allowed ? (
            <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
          ) : null}
        </div>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {!loaded ? (
        <p role="status">Loading editor…</p>
      ) : (
        allowed && (
          <>
            <div className={s.actions} style={{ marginBottom: 24 }}>
              <button
                className={preview ? w.secondary : w.primary}
                onClick={() => setPreview(false)}
              >
                Edit content
              </button>
              <button
                className={preview ? w.primary : w.secondary}
                onClick={() => setPreview(true)}
              >
                Preview
              </button>
            </div>
            {preview ? (
              <>
                <p className={s.notice}>
                  Preview only. Unsaved changes are shown here; athletes see
                  only published content.
                </p>
                <ResourceViewer
                  key={`${form.format}-${item?.media_url || ""}`}
                  resource={{
                    ...item,
                    ...form,
                    id: item?.id || "preview",
                    duration_minutes: Number(form.duration_minutes) || null,
                    status: item?.status || "draft",
                    featured: item?.featured || false,
                    version: item?.version || 1,
                  }}
                />
              </>
            ) : (
              <div className={s.editor}>
                <form
                  className={`${s.panel} ${s.form}`}
                  onSubmit={(e) => {
                    e.preventDefault();
                    save();
                  }}
                >
                  <fieldset disabled={busy || archived}>
                    <label>
                      Title
                      <input
                        required
                        maxLength={160}
                        value={form.title}
                        onChange={(e) => change("title", e.target.value)}
                        placeholder="A clear, useful title"
                      />
                    </label>
                    <label>
                      Short description
                      <textarea
                        rows={3}
                        maxLength={400}
                        value={form.summary}
                        onChange={(e) => change("summary", e.target.value)}
                        placeholder="What will athletes learn or take away?"
                      />
                    </label>
                    <label>
                      Topic
                      <select
                        value={form.topic}
                        onChange={(e) => change("topic", e.target.value)}
                      >
                        {Object.entries(topics).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Format
                      <select
                        value={form.format}
                        onChange={(e) => change("format", e.target.value)}
                      >
                        {Object.entries(formats).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Author or source
                      <input
                        maxLength={160}
                        value={form.author}
                        onChange={(e) => change("author", e.target.value)}
                        placeholder="Presenter, author or organisation"
                      />
                    </label>
                    <label>
                      Duration / reading time (minutes)
                      <input
                        type="number"
                        min={1}
                        max={600}
                        value={form.duration_minutes}
                        onChange={(e) =>
                          change("duration_minutes", e.target.value)
                        }
                      />
                      <small>
                        Optional. Help athletes choose something that fits their
                        time.
                      </small>
                    </label>
                    {form.format === "article" && (
                      <label>
                        Article
                        <textarea
                          rows={16}
                          maxLength={80000}
                          value={form.body}
                          onChange={(e) => change("body", e.target.value)}
                          placeholder="Write or paste your article. Paragraph breaks are preserved."
                        />
                      </label>
                    )}
                    <label>
                      {form.format === "article"
                        ? "Original source URL (optional)"
                        : "External resource URL (optional)"}
                      <input
                        type="url"
                        maxLength={2000}
                        value={form.source_url}
                        onChange={(e) => change("source_url", e.target.value)}
                        placeholder="https://"
                      />
                      <small>
                        {form.format === "video"
                          ? "YouTube and Vimeo videos can play in the viewer. Other links open the publisher’s website."
                          : "Use an external link or upload the media. Uploaded media takes priority."}
                      </small>
                    </label>
                    {["video", "audio"].includes(form.format) && (
                      <label>
                        Transcript (optional)
                        <textarea
                          rows={6}
                          maxLength={80000}
                          value={form.transcript}
                          onChange={(e) => change("transcript", e.target.value)}
                        />
                      </label>
                    )}
                  </fieldset>
                  <button
                    className={w.primary}
                    disabled={busy || archived || (!dirty && !!item)}
                  >
                    {busy
                      ? "Working…"
                      : published
                        ? "Save changes"
                        : "Save draft"}
                  </button>
                </form>
                <aside className={s.panel}>
                  <h2>Files</h2>
                  <p className={s.meta}>
                    {published
                      ? "Unpublish before replacing files."
                      : archived
                        ? "Restore to a draft to edit files."
                        : "Files are private until this resource is published."}
                  </p>
                  {!storage && (
                    <p className={s.error}>
                      Media uploads need storage configuration. You can still
                      write articles and add external source links.
                    </p>
                  )}
                  {[
                    "thumbnail",
                    ...(form.format !== "article" ? ["media"] : []),
                    ...(form.format === "video" ? ["captions"] : []),
                  ].map((purpose) => {
                    const asset = item?.assets?.find(
                      (a) => a.purpose === purpose,
                    );
                    const accept =
                      purpose === "thumbnail"
                        ? "image/jpeg,image/png,image/webp"
                        : purpose === "captions"
                          ? ".vtt"
                          : form.format === "video"
                            ? "video/mp4,video/webm"
                            : form.format === "audio"
                              ? "audio/mpeg,audio/mp4,audio/ogg,audio/wav"
                              : "application/pdf";
                    return (
                      <div className={s.file} key={purpose}>
                        <label>
                          {purpose === "thumbnail"
                            ? "Cover image"
                            : purpose === "captions"
                              ? "English captions"
                              : "Media file"}
                          <input
                            aria-label={
                              purpose === "thumbnail"
                                ? "Upload cover image"
                                : purpose === "captions"
                                  ? "Upload captions"
                                  : "Upload media"
                            }
                            type="file"
                            accept={accept}
                            disabled={busy || published || archived || !storage}
                            onChange={(e) => upload(purpose, e)}
                          />
                        </label>
                        <p>
                          {purpose === "thumbnail"
                            ? "JPG, PNG or WebP · up to 5 MB · landscape recommended"
                            : purpose === "captions"
                              ? "WebVTT (.vtt) · up to 1 MB"
                              : `${form.format === "video" ? "MP4 or WebM" : form.format === "audio" ? "MP3, M4A, OGG or WAV" : "PDF"} · up to 50 MB`}
                        </p>
                        {asset && (
                          <>
                            <p>
                              {asset.name} ·{" "}
                              {(asset.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                            <button
                              className={w.textButton}
                              disabled={busy || published || archived || dirty}
                              onClick={() => remove(purpose)}
                            >
                              Remove{" "}
                              {purpose === "thumbnail" ? "cover" : purpose}
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {progress !== null && (
                    <div role="status">
                      <progress max={100} value={progress} />
                      <p>
                        {progress === 100
                          ? "Checking upload…"
                          : `Uploading… ${progress}%`}
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            )}
            <div className={s.panel} style={{ marginTop: 24 }}>
              <h2>Publishing</h2>
              <p className={s.meta}>
                Publishing requires a title, description, author/source and
                playable or readable content. Only one resource can be featured
                at a time.
              </p>
              {dirty && item && (
                <p className={s.meta}>
                  Save your changes before changing publishing status.
                </p>
              )}
              <div className={s.actions}>
                {!published && !archived && (
                  <button
                    className={w.primary}
                    disabled={busy}
                    onClick={() => transition("publish")}
                  >
                    Publish resource
                  </button>
                )}
                {published && (
                  <>
                    <button
                      className={w.primary}
                      disabled={busy || dirty}
                      onClick={() =>
                        transition(item?.featured ? "unfeature" : "feature")
                      }
                    >
                      {item?.featured
                        ? "Remove featured placement"
                        : "Feature this resource"}
                    </button>
                    <button
                      className={w.secondary}
                      disabled={busy || dirty}
                      onClick={() => transition("unpublish")}
                    >
                      Unpublish
                    </button>
                  </>
                )}
                {item && !archived && (
                  <button
                    className={w.secondary}
                    disabled={busy || dirty}
                    onClick={() => transition("archive")}
                  >
                    Archive resource
                  </button>
                )}
                {archived && (
                  <button
                    className={w.primary}
                    disabled={busy}
                    onClick={() => transition("restore")}
                  >
                    Restore as draft
                  </button>
                )}
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
}
