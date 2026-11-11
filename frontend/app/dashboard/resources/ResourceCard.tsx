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
  return resource.thumbnail_url ? (
    <img
      className={className || s.art}
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
      <Artwork resource={r} />
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
        <div className={s.meta}>
          {topics[r.topic]} · {r.author || "Source not added"}
        </div>
        <Link className={s.cta} href={href}>
          {admin ? "Manage resource" : actionLabel(r)} ↗
        </Link>
      </div>
    </article>
  );
}
