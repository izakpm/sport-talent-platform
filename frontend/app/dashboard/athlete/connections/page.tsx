"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { hub } from "../../team-hub/api";
import s from "../../coaches/workspace.module.css";
import c from "./connections.module.css";
type Team = { id: string; name: string; age_group: string; sport: string };
type Person = {
  id: string;
  name: string;
  role: "coach" | "teammate";
  profile_image: string | null;
  team_ids: string[];
};
type Network = { teams: Team[]; people: Person[] };
function Avatar({ person }: { person: Person }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [person.profile_image]);
  return (
    <span className={c.avatar}>
      {person.profile_image && !failed ? (
        <img
          src={person.profile_image}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        person.name
          .split(/\s+/)
          .map((v) => v[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      )}
    </span>
  );
}
export default function Connections() {
  const [data, setData] = useState<Network | null>(null),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0),
    [team, setTeam] = useState(""),
    [role, setRole] = useState(""),
    [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const next = await hub<Network>("/connections");
        if (active) {
          setData(next);
          setError("");
          setTeam((v) => (next.teams.some((t) => t.id === v) ? v : ""));
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [retry]);
  const visible = (data?.people || []).filter(
    (p) =>
      (!team || p.team_ids.includes(team)) &&
      (!role || p.role === role) &&
      p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const coaches = data?.people.filter((p) => p.role === "coach").length || 0,
    teammates = data?.people.filter((p) => p.role === "teammate").length || 0;
  return (
    <div className={s.workspace}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>MY TEAM NETWORK</p>
          <h1>Connections</h1>
          <p className={s.subtitle}>
            The coaches guiding you. The teammates growing with you.
          </p>
        </div>
        <Link className={s.primary} href="/dashboard/athlete/feed">
          Open Team Feed ↗
        </Link>
      </header>
      {error && (
        <div role="alert" className={s.error}>
          <span>
            {error}
            {data ? " Showing your last loaded connections." : ""}
          </span>
          <button
            className={s.secondary}
            onClick={() => setRetry((v) => v + 1)}
          >
            Try again
          </button>
        </div>
      )}
      {!data && !error && (
        <div role="status" className={s.loading}>
          Loading your connections…
        </div>
      )}
      {data && (
        <>
          <section className={c.hero}>
            <div>
              <p className={c.eyebrow}>CONNECTED THROUGH YOUR TEAMS</p>
              <h2>Your people. Your progress.</h2>
              <p>
                Your connections come from the teams your coach has linked you
                to on PlayVerified.
              </p>
            </div>
            <dl className={c.counts}>
              <div>
                <dd>{coaches}</dd>
                <dt>{coaches === 1 ? "Coach" : "Coaches"}</dt>
              </div>
              <div>
                <dd>{teammates}</dd>
                <dt>{teammates === 1 ? "Teammate" : "Teammates"}</dt>
              </div>
              <div>
                <dd>{data.teams.length}</dd>
                <dt>{data.teams.length === 1 ? "Team" : "Teams"}</dt>
              </div>
            </dl>
          </section>
          {!data.teams.length ? (
            <section className={c.empty}>
              <h2>Your team network starts here.</h2>
              <p>
                Ask your coach to add you to their team and link your player
                record using the email you registered with. Your coach and
                linked teammates will then appear here.
              </p>
              <Link href="/dashboard/profile" className={s.secondary}>
                View my profile ↗
              </Link>
            </section>
          ) : (
            <>
              <section className={c.filters} aria-label="Connection filters">
                <label>
                  Search people
                  <input
                    type="search"
                    placeholder="Search by name"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <label>
                  Team
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                  >
                    <option value="">All teams</option>
                    {data.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Connection
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="">Coaches & teammates</option>
                    <option value="coach">Coaches</option>
                    <option value="teammate">Teammates</option>
                  </select>
                </label>
              </section>
              <div className={c.sectionHeading}>
                <h2>Your connections</h2>
                <span aria-live="polite">
                  {visible.length} {visible.length === 1 ? "person" : "people"}
                </span>
              </div>
              {visible.length ? (
                <div className={c.grid}>
                  {visible.map((p) => (
                    <article className={c.card} key={p.id}>
                      <div className={c.identity}>
                        <Avatar person={p} />
                        <div>
                          <p className={c.role}>
                            {p.role === "coach" ? "COACH" : "TEAMMATE"}
                          </p>
                          <h3>{p.name}</h3>
                        </div>
                      </div>
                      <p className={c.shared}>
                        Shared {p.team_ids.length === 1 ? "team" : "teams"}
                      </p>
                      <ul className={c.teams}>
                        {p.team_ids.map((id) => {
                          const t = data.teams.find((t) => t.id === id);
                          return t ? (
                            <li key={id}>
                              <strong>{t.name}</strong>
                              <span>
                                {[t.age_group, t.sport]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </li>
                          ) : null;
                        })}
                      </ul>
                    </article>
                  ))}
                </div>
              ) : (
                <div className={c.empty}>
                  <h3>
                    {data.people.length
                      ? "No connections match these filters."
                      : "No linked people to show yet."}
                  </h3>
                  <p>
                    {data.people.length
                      ? "Try another name, team or connection type."
                      : "Teammates appear once your coach links their active roster entries to PlayVerified accounts."}
                  </p>
                  {data.people.length > 0 && (
                    <button
                      className={s.secondary}
                      onClick={() => {
                        setTeam("");
                        setRole("");
                        setQuery("");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
              <p className={c.note}>
                Only coaches and teammates linked to your active teams appear
                here. Teammates without linked accounts are not shown.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
