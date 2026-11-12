"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { resources, Resource, ResourceList } from "./api";
import ResourceViewer from "./ResourceViewer";
import ResourceCard from "./ResourceCard";
import s from "./resources.module.css";
export default function ResourceDetail({
  basePath = "/dashboard/athlete/resources",
}: { basePath?: string } = {}) {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Resource | null>(null),
    [related, setRelated] = useState<Resource[]>([]),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setItem(null);
    setError("");
    resources<Resource>(`/${id}`)
      .then(async (row) => {
        if (!active) return;
        setItem(row);
        try {
          const next = await resources<ResourceList>(`?topic=${row.topic}`);
          if (active)
            setRelated(next.items.filter((r) => r.id !== id).slice(0, 3));
        } catch {}
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, retry]);
  return (
    <div className={s.page}>
      <Link href={basePath} className={s.back}>
        ← Back to resources
      </Link>
      {error ? (
        <p role="alert" className={s.error}>
          {error} <button onClick={() => setRetry((n) => n + 1)}>Retry</button>
        </p>
      ) : item ? (
        <ResourceViewer key={`${id}-${retry}`} resource={item} />
      ) : (
        <p role="status">Loading resource…</p>
      )}
      {item && related.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <h2>Keep exploring</h2>
          <div className={s.grid}>
            {related.map((r) => (
              <ResourceCard key={r.id} resource={r} basePath={basePath} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
