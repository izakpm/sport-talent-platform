"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";
import s from "./overview.module.css";

type Affiliation = {
  id: string;
  name: string;
  type: string;
  status: string;
  logo_url?: string | null;
};

export default function AffiliationBadges() {
  const [items, setItems] = useState<Affiliation[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const response = await fetchWithAuth("/affiliations", {
          cache: "no-store",
        });
        if (!response?.ok) throw Error("Unable to load affiliations");
        const data = await response.json();
        if (active) {
          setItems(
            data.affiliations.filter((a: Affiliation) =>
              ["requested", "confirmed"].includes(a.status),
            ),
          );
          setFailed(false);
        }
      } catch {
        if (active) setFailed(true);
      }
    }
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);
  if (failed)
    return (
      <Link
        className={s.affiliationPrompt}
        href="/dashboard/profile#affiliations"
      >
        View schools &amp; clubs ↗
      </Link>
    );
  if (!items) return null;
  if (!items.length)
    return (
      <Link
        className={s.affiliationPrompt}
        href="/dashboard/profile#affiliations"
      >
        + Add your school or club
      </Link>
    );
  return (
    <ul className={s.affiliationBadges} aria-label="Current schools and clubs">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className={s.affiliationBadge}
            href="/dashboard/profile#affiliations"
          >
            {item.logo_url && (
              <img src={item.logo_url} alt="" width={32} height={32} />
            )}
            <span>
              <strong>{item.name}</strong>
              <small>
                {item.type.toUpperCase() === "SCHOOL" ? "School" : "Club"} ·{" "}
                {item.status === "confirmed" ? "Confirmed" : "Self-reported"}
              </small>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
