"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  resources,
  topics,
  ResourceList,
  actionLabel,
  durationLabel,
} from "./api";
import ResourceCard, { Artwork } from "./ResourceCard";
import s from "./resources.module.css";
import w from "../coaches/workspace.module.css";
export default function ResourceLibrary({
  admin = false,
}: {
  admin?: boolean;
}) {
  const [search, setSearch] = useState(""),
    [topic, setTopic] = useState(""),
    [format, setFormat] = useState(""),
    [status, setStatus] = useState(""),
    [data, setData] = useState<ResourceList | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [more, setMore] = useState(false),
    [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const query = () => new URLSearchParams({ search, topic, format, status });
  useEffect(() => {
    let active = true;
    const version = ++generation.current;
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      resources<ResourceList>(
        `${admin ? "/admin" : ""}?${new URLSearchParams({ search, topic, format, status })}`,
      )
        .then((d) => {
          if (active && version === generation.current) setData(d);
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, topic, format, status, admin, retry]);
  async function loadMore() {
    if (data?.next_offset == null) return;
    const version = generation.current;
    setMore(true);
    setError("");
    try {
      const q = query();
      q.set("offset", String(data.next_offset));
      const next = await resources<ResourceList>(
        `${admin ? "/admin" : ""}?${q}`,
      );
      if (version === generation.current)
        setData((old) =>
          old
            ? {
                ...next,
                featured: old.featured,
                items: [
                  ...old.items,
                  ...next.items.filter(
                    (r) => !old.items.some((x) => x.id === r.id),
                  ),
                ],
              }
            : next,
        );
    } catch (e) {
      if (version === generation.current) setError((e as Error).message);
    } finally {
      setMore(false);
    }
  }
  const filtered = !!(search || topic || format || status);
  const featured = data?.featured;
  return (
    <div className={s.page}>
      <header className={s.heading}>
        <div>
          <p className={s.eyebrow}>
            {admin ? "PUBLISHING DESK" : "BEYOND THE FIELD"}
          </p>
          <h1>{admin ? "Manage resources" : "Resources"}</h1>
          <p>
            {admin
              ? "Create, preview and publish the athlete library."
              : "Build your game. Beyond the field."}
          </p>
        </div>
        {admin && (
          <Link href="/dashboard/resources-admin/new" className={w.primary}>
            + Add resource
          </Link>
        )}
      </header>
      {!admin && !filtered && !loading && featured && (
        <section className={s.feature}>
          <Artwork resource={featured} className={s.featureImage} />
          <div className={s.featureCopy}>
            <div className={s.eyebrow}>FEATURED RESOURCE</div>
            <h2>{featured.title}</h2>
            <p>{featured.summary}</p>
            <p>
              {featured.author} · {durationLabel(featured)}
            </p>
            <Link
              className={w.primary}
              href={`/dashboard/athlete/resources/${featured.id}`}
            >
              {actionLabel(featured)} ↗
            </Link>
          </div>
        </section>
      )}
      <div className={s.filters}>
        <div className={s.searchRow}>
          <label>
            Search resources
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, topic or presenter"
            />
          </label>
          <label>
            Format
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="">Watch, listen & read</option>
              <option value="video">Watch · Videos</option>
              <option value="audio">Listen · Podcasts & audio</option>
              <option value="article">Read · Articles</option>
              <option value="guide">Read · Guides</option>
            </select>
          </label>
          {admin && (
            <label>
              Publishing status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Drafts</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          )}
        </div>
        <div className={s.chips} aria-label="Resource topics">
          <button aria-pressed={!topic} onClick={() => setTopic("")}>
            All topics
          </button>
          {Object.entries(topics).map(([id, name]) => (
            <button
              key={id}
              aria-pressed={topic === id}
              onClick={() => setTopic(id)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className={s.error}>
          {error}{" "}
          <button
            className={w.textButton}
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">Loading resources…</p>
      ) : (
        !error &&
        data && (
          <>
            <div className={s.resultHead}>
              <h2>
                {filtered
                  ? "Your results"
                  : admin
                    ? "Your library"
                    : "Explore the library"}
              </h2>
              <span>
                {data.total} {data.total === 1 ? "resource" : "resources"}
              </span>
            </div>
            {data.items.length ? (
              <div className={s.grid}>
                {data.items.map((r) => (
                  <ResourceCard key={r.id} resource={r} admin={admin} />
                ))}
              </div>
            ) : (
              <div className={s.empty}>
                <h2>
                  {filtered
                    ? "No matching resources."
                    : admin
                      ? "Your library starts here."
                      : "Your next edge is on its way."}
                </h2>
                <p>
                  {filtered
                    ? "Try another topic, format or search."
                    : admin
                      ? "Add your first video, podcast, article or guide. Save it as a draft until you are ready to publish."
                      : "Videos, podcasts and practical guides will appear here as our team publishes them."}
                </p>
                {filtered && (
                  <button
                    className={w.secondary}
                    onClick={() => {
                      setSearch("");
                      setTopic("");
                      setFormat("");
                      setStatus("");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {data.next_offset !== null && (
              <div className={s.more}>
                <button
                  className={w.secondary}
                  disabled={more}
                  onClick={loadMore}
                >
                  {more ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
