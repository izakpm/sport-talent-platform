"use client";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../lib/api";
import AchievementOrganisationLogo from "./AchievementOrganisationLogo";
import a from "./athlete-profile.module.css";

export type AchievementOrganisation = {
  id: string | null;
  name: string;
  logo_url?: string | null;
};
export default function AchievementOrganisationPicker({
  value,
  onChange,
  onPendingChange,
}: {
  value: AchievementOrganisation;
  onPendingChange: (pending: boolean) => void;
  onChange: (value: AchievementOrganisation) => void;
}) {
  const [query, setQuery] = useState("");
  const [manual, setManual] = useState(!value.id && !!value.name);
  const [results, setResults] = useState<
    (AchievementOrganisation & { type: string; location?: string })[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onPendingChange(!manual && !value.id && !!query.trim());
  }, [manual, value.id, query, onPendingChange]);
  useEffect(() => {
    let active = true;
    setResults([]);
    setError("");
    if (value.id || manual || query.trim().length < 2) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetchWithAuth(
          `/affiliations/organisations?q=${encodeURIComponent(query.trim())}`,
        );
        if (!response?.ok)
          throw Error(
            "Schools and clubs could not be loaded. Try searching again.",
          );
        const rows = await response.json();
        if (active) setResults(rows);
      } catch (error) {
        if (active) setError((error as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, manual, value.id]);
  return (
    <div className={a.orgPicker}>
      <p className={a.orgLabel}>School or club</p>
      {value.id ? (
        <div className={a.orgSelected}>
          <AchievementOrganisationLogo
            organization={value.name}
            logoUrl={value.logo_url}
          />
          <strong>{value.name}</strong>
          <button
            type="button"
            onClick={() => {
              onChange({ id: null, name: "" });
              setQuery("");
              setManual(false);
            }}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          {manual ? (
            <label>
              School, club or competition
              <input
                aria-label="School, club or competition"
                value={value.name}
                maxLength={160}
                onChange={(e) => onChange({ id: null, name: e.target.value })}
              />
              <small>A manually entered name has no directory logo.</small>
            </label>
          ) : (
            <>
              <label>
                Find a school or club
                <input
                  type="search"
                  value={query}
                  maxLength={100}
                  placeholder="Search by name or location"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              {loading && <p role="status">Searching…</p>}
              {error && <p role="alert">{error}</p>}
              {!loading &&
                !error &&
                query.trim().length >= 2 &&
                !results.length && (
                  <p>No matches. Try another name, or enter a name manually.</p>
                )}
              {!!results.length && (
                <ul
                  className={a.orgResults}
                  aria-label="Matching schools and clubs"
                >
                  {results.map((org) => (
                    <li key={org.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(org);
                          setQuery("");
                        }}
                      >
                        <AchievementOrganisationLogo
                          organization={org.name}
                          logoUrl={org.logo_url}
                        />
                        <span>
                          <strong>{org.name}</strong>
                          <small>
                            {org.type === "SCHOOL" ? "School" : "Club"}
                            {org.location ? ` · ${org.location}` : ""}
                          </small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && !value.id && (
                <p>
                  Select a result to link its logo, or clear the search to leave
                  this blank.
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setManual(!manual);
              setQuery("");
              onChange({ id: null, name: "" });
            }}
          >
            {manual ? "Choose from the directory" : "Enter a name manually"}
          </button>
        </>
      )}
    </div>
  );
}
