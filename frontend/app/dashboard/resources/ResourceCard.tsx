"use client";
import { useState } from "react";
import Link from "next/link";
import { Resource, topics, formats, actionLabel, durationLabel } from "./api";
import s from "./resources.module.css";
export function Artwork({
  resource,
  className,
}: {
  resource: Resource;
  className?: string;
}) {
  const [portrait, setPortrait] = useState(false);
  return resource.thumbnail_url ? (
    <img
      className={className || `${s.art} ${portrait ? s.portraitArt : ""}`}
      onLoad={(event) =>
        setPortrait(
          event.currentTarget.naturalHeight > event.currentTarget.naturalWidth,
        )
      }
      src={resource.thumbnail_url}
      alt=""
      loading="lazy"
    />
  ) : (
    <div className={`${s.placeholder} ${className || ""}`} aria-hidden="true">
      {resource.format === "video"
        ? "▶"
        : resource.format === "audio"
          ? "♫"
          : "▤"}
    </div>
  );
}
export default function ResourceCard({
  resource: r,
  admin = false,
}: {
  resource: Resource;
  admin?: boolean;
}) {
  const href = admin
    ? `/dashboard/resources-admin/${r.id}`
    : `/dashboard/athlete/resources/${r.id}`;
  return (
    <article className={s.card}>
      <div className={s.postAuthor}>
        <span className={s.authorAvatar} aria-hidden="true">
          {r.author
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("") || "PV"}
        </span>
        <div>
          <strong>{r.author || "PlayVerified"}</strong>
          <span>{topics[r.topic]}</span>
        </div>
      </div>
      <Link
        href={href}
        className={s.posterLink}
        aria-label={`${admin ? "Manage" : actionLabel(r)}: ${r.title}`}
      >
        <Artwork resource={r} />
        {r.format === "video" && (
          <span className={s.playBadge} aria-hidden="true">
            ▶
          </span>
        )}
      </Link>
      <div className={s.cardBody}>
        <div className={s.meta}>
          <span className={s.tag}>{formats[r.format]}</span>
          <span>· {durationLabel(r)}</span>
          {admin && (
            <span className={s.status}>
              {r.status}
              {r.featured ? " · Featured" : ""}
            </span>
          )}
        </div>
        <h3>
          <Link href={href}>{r.title}</Link>
        </h3>
        <p>{r.summary || "Add a description before publishing."}</p>
        <Link className={s.cta} href={href}>
          {admin ? "Manage resource" : actionLabel(r)} ↗
        </Link>
      </div>
    </article>
  );
}
