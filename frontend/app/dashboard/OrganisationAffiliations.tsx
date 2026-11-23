"use client";
import { useEffect, useState, type FormEvent } from "react";
import { fetchWithAuth } from "../lib/api";
import type { GuardianChild } from "../lib/guardian-context";
import s from "./organisation-affiliations.module.css";

type Organisation = {
  id: string;
  name: string;
  type: string;
  location?: string;
  logo_url?: string;
};
type Affiliation = Organisation & {
  organisation_id: string;
  status: string;
  starts_on: string;
  ends_on?: string;
  role: string;
};
type Result = { affiliations: Affiliation[]; can_edit: boolean };
async function request<T>(
  path: string,
  childId?: string,
  body?: object,
): Promise<T> {
  const response = await fetchWithAuth(path, {
    ...(childId !== undefined ? { headers: { "X-Athlete-Id": childId } } : {}),
    ...(body
      ? { method: "POST", body: JSON.stringify(body) }
      : { cache: "no-store" }),
  });
  if (!response) throw Error("Please sign in again.");
  const data = await response.json();
  if (!response.ok)
    throw Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to update affiliations. Please try again.",
    );
  return data;
}
export default function OrganisationAffiliations({
  family = false,
}: {
  family?: boolean;
}) {
  const [children, setChildren] = useState<GuardianChild[]>([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!family) return;
    let live = true;
    request<GuardianChild[]>("/guardian/children", "")
      .then((rows) => {
        if (live) setChildren(rows.filter((c) => c.status === "accepted"));
      })
      .catch(() => {
        if (live)
          setError(
            "Children could not be loaded. Your own affiliations are still available.",
          );
      });
    return () => {
      live = false;
    };
  }, [family]);
  return (
    <section className={s.card} aria-labelledby="affiliations-title">
      <header>
        <h2 id="affiliations-title">Schools &amp; clubs</h2>
        <p>Your sporting community, on your profile.</p>
      </header>
      <div className={s.content}>
        {family && (
          <label className={s.owner}>
            Show affiliations for
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="">Myself</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                  {c.mode === "view" ? " · view only" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <p role="status">{error}</p>}
        <AffiliationList
          key={selected}
          childId={family ? selected : undefined}
        />
      </div>
    </section>
  );
}
function AffiliationList({ childId }: { childId?: string }) {
  const [data, setData] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [matches, setMatches] = useState<Organisation[]>([]);
  const [selected, setSelected] = useState<Organisation | null>(null);
  const [date, setDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setError("");
    request<Result>("/affiliations", childId)
      .then((result) => {
        if (live) setData(result);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [childId, retry]);
  useEffect(() => {
    let live = true;
    setSearchError("");
    setMatches([]);
    if (!adding || query.trim().length < 2 || selected) {
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      request<Organisation[]>(
        `/affiliations/organisations?q=${encodeURIComponent(query.trim())}&type=${type}`,
        childId,
      )
        .then((rows) => {
          if (live) setMatches(rows);
        })
        .catch((e) => {
          if (live) setSearchError(e.message);
        })
        .finally(() => {
          if (live) setSearching(false);
        });
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [adding, query, type, selected, childId]);
  async function add(event: FormEvent) {
    event.preventDefault();
    if (!selected || busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setData(
        await request<Result>("/affiliations", childId, {
          organisation_id: selected.id,
          ...(date ? { starts_on: date } : {}),
        }),
      );
      setAdding(false);
      setSelected(null);
      setQuery("");
      setDate("");
      setNotice("Affiliation added as self-reported.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function end(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setData(await request<Result>(`/affiliations/${id}/end`, childId, {}));
      setEnding(null);
      setNotice("Affiliation ended. It remains in your history.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const current =
    data?.affiliations.filter((a) =>
      ["requested", "confirmed"].includes(a.status),
    ) || [];
  const past =
    data?.affiliations.filter(
      (a) => !["requested", "confirmed"].includes(a.status),
    ) || [];
  function row(a: Affiliation, history = false) {
    return (
      <li key={a.id} className={s.row}>
        <div className={s.summary}>
          {a.logo_url && <img src={a.logo_url} alt="" width="48" height="48" />}
          <div>
            <strong>{a.name}</strong>
            <span>
              {a.type?.toUpperCase() === "SCHOOL" ? "School" : "Club"}
              {a.location ? ` · ${a.location}` : ""}
            </span>
            <small>
              Since {a.starts_on}
              {a.ends_on ? ` · Ended ${a.ends_on}` : ""}
            </small>
          </div>
        </div>
        <div className={s.rowActions}>
          <span className={s.badge}>
            {a.status === "requested"
              ? "Self-reported"
              : a.status === "confirmed"
                ? "Confirmed"
                : a.status === "ended"
                  ? "Ended"
                  : "Not confirmed"}
          </span>
          {!history && data?.can_edit && (
            <button
              className={s.secondary}
              disabled={busy}
              onClick={() => setEnding(a.id)}
            >
              End affiliation
            </button>
          )}
        </div>
        {ending === a.id && (
          <div className={s.confirm}>
            <p>
              End your affiliation with {a.name}? Your history will be kept.
            </p>
            <button disabled={busy} onClick={() => end(a.id)}>
              {busy ? "Saving…" : "Confirm end"}
            </button>
            <button
              disabled={busy}
              className={s.secondary}
              onClick={() => setEnding(null)}
            >
              Keep affiliation
            </button>
          </div>
        )}
      </li>
    );
  }
  return (
    <>
      <p className={s.description}>
        Add the schools and clubs you belong to. These profile links are
        self-reported and do not change team access or parent approvals.
      </p>
      {error && (
        <div role="alert" className={s.error}>
          {error}
          {!data && (
            <button
              className={s.secondary}
              onClick={() => setRetry((v) => v + 1)}
            >
              Try again
            </button>
          )}
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {!data && !error && <p role="status">Loading affiliations…</p>}
      {data && (
        <>
          {!current.length && <p>No current schools or clubs added yet.</p>}
          <ul className={s.list}>{current.map((a) => row(a))}</ul>
          {!data.can_edit && (
            <p>This linked athlete’s affiliations are view-only.</p>
          )}
          {data.can_edit && !adding && (
            <button
              onClick={() => {
                setAdding(true);
                setError("");
              }}
            >
              Add school or club +
            </button>
          )}
          {data.can_edit && adding && (
            <form
              onSubmit={add}
              className={s.form}
              aria-label="Add school or club"
            >
              <div className={s.fields}>
                <label>
                  Organisation type
                  <select
                    value={type}
                    disabled={busy}
                    onChange={(e) => {
                      setType(e.target.value);
                      setSelected(null);
                    }}
                  >
                    <option value="">Schools &amp; clubs</option>
                    <option value="SCHOOL">Schools</option>
                    <option value="CLUB">Clubs</option>
                  </select>
                </label>
                <label>
                  Find your school or club
                  <input
                    autoFocus
                    maxLength={100}
                    value={query}
                    disabled={busy}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelected(null);
                    }}
                    placeholder="Search by name or town"
                  />
                </label>
              </div>
              {searching && <p role="status">Searching…</p>}
              {searchError && (
                <p role="alert" className={s.error}>
                  {searchError}
                </p>
              )}
              {!selected &&
                !searching &&
                query.trim().length >= 2 &&
                !searchError && (
                  <>
                    <ul className={s.results}>
                      {matches.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            className={s.secondary}
                            onClick={() => {
                              setSelected(o);
                              setQuery(o.name);
                            }}
                          >
                            <strong>{o.name}</strong>
                            <span>
                              {o.type?.toUpperCase() === "SCHOOL"
                                ? "School"
                                : "Club"}
                              {o.location ? ` · ${o.location}` : ""}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className={s.hint}>
                      {matches.length
                        ? "Showing up to 30 matches. Add more of the name or town to narrow your search."
                        : "No matches found. Try another spelling or town. If it is missing, contact info@bulperd.com to have it added."}
                    </p>
                  </>
                )}
              {selected && (
                <div className={s.selection}>
                  <strong>Selected: {selected.name}</strong>
                  <label>
                    Start date (optional)
                    <input
                      type="date"
                      min="1900-01-01"
                      max={new Date().toLocaleDateString("en-CA", {
                        timeZone: "Africa/Johannesburg",
                      })}
                      value={date}
                      disabled={busy}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </label>
                  <p className={s.hint}>
                    Leave blank to start today. This link is private and has not
                    been confirmed by the organisation.
                  </p>
                </div>
              )}
              <div className={s.actions}>
                <button disabled={busy || !selected} type="submit">
                  {busy ? "Saving…" : "Add affiliation"}
                </button>
                <button
                  disabled={busy}
                  type="button"
                  className={s.secondary}
                  onClick={() => {
                    setAdding(false);
                    setSelected(null);
                    setQuery("");
                    setDate("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {!!past.length && (
            <details className={s.history}>
              <summary>Previous affiliations ({past.length})</summary>
              <ul className={s.list}>{past.map((a) => row(a, true))}</ul>
            </details>
          )}
        </>
      )}
    </>
  );
}
