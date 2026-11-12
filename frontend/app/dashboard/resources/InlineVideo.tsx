"use client";
import { useEffect, useId, useRef, useState } from "react";
import { Resource, resources } from "./api";
import { embedUrl } from "./ResourceViewer";
import s from "./resources.module.css";

export default function InlineVideo({ resource }: { resource: Resource }) {
  const id = useId();
  const request = useRef(0);
  const [detail, setDetail] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const stop = (event: Event) => {
      if ((event as CustomEvent).detail !== id) {
        request.current++;
        setDetail(null);
        setLoading(false);
      }
    };
    window.addEventListener("resource-video-play", stop);
    return () => {
      request.current++;
      window.removeEventListener("resource-video-play", stop);
    };
  }, [id]);
  async function play() {
    window.dispatchEvent(
      new CustomEvent("resource-video-play", { detail: id }),
    );
    const version = ++request.current;
    setLoading(true);
    setError("");
    setDetail(null);
    try {
      const fresh = await resources<Resource>(`/${resource.id}`);
      if (version === request.current) setDetail(fresh);
    } catch {
      if (version === request.current)
        setError("Unable to load this video. Please try again.");
    } finally {
      if (version === request.current) setLoading(false);
    }
  }
  const embed = detail?.source_url ? embedUrl(detail.source_url) : null;
  return (
    <div>
      <div className={`${s.inlineFrame} ${portrait ? s.inlinePortrait : ""}`}>
        {detail?.media_url && !error ? (
          <video
            className={s.inlineMedia}
            aria-label={resource.title}
            src={detail.media_url}
            poster={resource.thumbnail_url || undefined}
            controls
            autoPlay
            playsInline
            crossOrigin={detail.captions_url ? "anonymous" : undefined}
            onLoadedMetadata={(event) =>
              setPortrait(
                event.currentTarget.videoHeight >
                  event.currentTarget.videoWidth,
              )
            }
            onPlay={() =>
              window.dispatchEvent(
                new CustomEvent("resource-video-play", { detail: id }),
              )
            }
            onError={() =>
              setError("This video could not be played. Try loading it again.")
            }
          >
            {detail.captions_url && (
              <track
                kind="captions"
                srcLang="en"
                label="English"
                src={detail.captions_url}
                default
              />
            )}
          </video>
        ) : embed && !error ? (
          <iframe
            className={s.inlineMedia}
            src={embed.includes("autoplay=") ? embed : `${embed}?autoplay=1`}
            title={resource.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : detail?.source_url && !error ? (
          <a
            className={s.inlineFallback}
            href={detail.source_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch on publisher’s website ↗
          </a>
        ) : (
          <button
            className={s.inlinePoster}
            onClick={play}
            disabled={loading}
            aria-label={`${loading ? "Loading" : error ? "Retry video" : "Watch video"}: ${resource.title}`}
          >
            {resource.thumbnail_url && (
              <img
                src={resource.thumbnail_url}
                alt=""
                loading="lazy"
                onLoad={(event) =>
                  setPortrait(
                    event.currentTarget.naturalHeight >
                      event.currentTarget.naturalWidth,
                  )
                }
              />
            )}
            <span className={s.playBadge} aria-hidden="true">
              {loading ? "…" : "▶"}
            </span>
          </button>
        )}
      </div>
      {loading && <p role="status">Loading video…</p>}
      {error && (
        <p role="alert" className={s.error}>
          {error}
        </p>
      )}
      {detail && !detail.media_url && !detail.source_url && (
        <p role="alert">This video is currently unavailable.</p>
      )}
      {detail?.transcript && (
        <details className={s.inlineTranscript}>
          <summary>Read transcript</summary>
          <p>{detail.transcript}</p>
        </details>
      )}
    </div>
  );
}
