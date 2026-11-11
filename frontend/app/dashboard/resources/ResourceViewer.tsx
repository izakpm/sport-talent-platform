"use client";
import { useState } from "react";
import { Resource, topics, durationLabel, actionLabel } from "./api";
import s from "./resources.module.css";
import w from "../coaches/workspace.module.css";
export function embedUrl(value: string) {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return null;
    const host = u.hostname.toLowerCase();
    const id = ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
      host,
    )
      ? u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})$/)?.[1]
      : host === "youtu.be"
        ? u.pathname.slice(1)
        : null;
    if (id && /^[\w-]{11}$/.test(id))
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    if (
      ["vimeo.com", "www.vimeo.com"].includes(host) &&
      /^\/\d+$/.test(u.pathname)
    )
      return `https://player.vimeo.com/video${u.pathname}`;
  } catch {}
  return null;
}
export default function ResourceViewer({
  resource: r,
}: {
  resource: Resource;
}) {
  const [play, setPlay] = useState(false),
    [failed, setFailed] = useState(false);
  const embed =
    r.format === "video" && r.source_url ? embedUrl(r.source_url) : null;
  return (
    <article className={s.viewer}>
      <div className={s.eyebrow}>{topics[r.topic]}</div>
      <h1>{r.title}</h1>
      <div className={s.meta}>
        {r.author} · {durationLabel(r)}
      </div>
      <p className={s.intro}>{r.summary}</p>
      {r.format === "article" ? (
        <div className={s.article}>{r.body}</div>
      ) : r.media_url ? (
        r.format === "video" ? (
          <video
            className={`${s.media} ${s.video}`}
            controls
            preload="metadata"
            poster={r.thumbnail_url || undefined}
            crossOrigin={r.captions_url ? "anonymous" : undefined}
            onError={() => setFailed(true)}
          >
            <source src={r.media_url} />
            {r.captions_url && (
              <track
                kind="captions"
                srcLang="en"
                label="English"
                src={r.captions_url}
                default
              />
            )}
          </video>
        ) : r.format === "audio" ? (
          <div className={s.audio}>
            <audio
              controls
              preload="metadata"
              src={r.media_url}
              onError={() => setFailed(true)}
            />
          </div>
        ) : (
          <div className={s.panel}>
            <p>Open the PDF guide in your browser.</p>
            <a
              className={w.primary}
              href={r.media_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read guide ↗
            </a>
          </div>
        )
      ) : embed ? (
        <div className={s.panel}>
          {play ? (
            <iframe
              className={s.video}
              src={embed}
              title={r.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <>
              <p>
                Watch this video from{" "}
                {r.source_url?.includes("vimeo") ? "Vimeo" : "YouTube"}.
              </p>
              <button className={w.primary} onClick={() => setPlay(true)}>
                Watch video
              </button>
            </>
          )}
        </div>
      ) : r.source_url ? (
        <div className={s.panel}>
          <p>This resource opens on the publisher's website.</p>
          <a
            className={w.primary}
            href={r.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {actionLabel(r)} ↗
          </a>
        </div>
      ) : (
        <p className={s.empty}>Add content to preview this resource.</p>
      )}
      {failed && (
        <p role="alert" className={s.error}>
          This media could not be played. Refresh the page to renew its viewing
          link.
        </p>
      )}
      {r.transcript && (
        <details className={s.transcript}>
          <summary>Read transcript</summary>
          <p>{r.transcript}</p>
        </details>
      )}
      {r.source_url && (r.media_url || r.format === "article") && (
        <p>
          <a href={r.source_url} target="_blank" rel="noopener noreferrer">
            Original source ↗
          </a>
        </p>
      )}
    </article>
  );
}
