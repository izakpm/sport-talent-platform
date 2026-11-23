"use client";
import { organisationLogoStyle } from "../lib/organisation-logos";
import { useState } from "react";
import schools from "./schools.json";
import universities from "./universities.json";
import clubs from "./clubs.json";
import websites from "./websites.json";
const websiteLinks: Record<string, string> = websites;
const institutions = [
  ...schools.map((s) => ({ ...s, alias: "", typeLabel: "" })),
  ...universities,
  ...clubs,
];
const groups = [
  { id: "primary", title: "Primary schools" },
  { id: "combined", title: "Primary & high schools" },
  { id: "high", title: "High schools" },
  { id: "university", title: "Universities" },
  { id: "club", title: "Clubs" },
];
import s from "./network.module.css";
const normalise = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export default function NetworkDirectory() {
  const [query, setQuery] = useState("");
  const [partnersOnly, setPartnersOnly] = useState(false);
  const [level, setLevel] = useState("all");
  const rows = institutions
    .filter(
      (school) =>
        (!partnersOnly || school.partner) &&
        (level === "all" || school.levels.includes(level)) &&
        normalise(
          `${school.name} ${school.alias} ${school.location} ${school.province}`,
        ).includes(normalise(query.trim())),
    )
    .sort(
      (a, b) =>
        Number(b.partner) - Number(a.partner) || a.name.localeCompare(b.name),
    );
  const visibleGroups = groups
    .map((group) => ({
      ...group,
      members: rows.filter(
        (item) =>
          (item.levels.length === 2 ? "combined" : item.levels[0]) === group.id,
      ),
    }))
    .filter((group) => group.members.length > 0);
  return (
    <section className={s.directory} aria-labelledby="directory-title">
      <div className={s.directoryHeading}>
        <div>
          <p className={s.eyebrow}>OUR COMMUNITY</p>
          <h2 id="directory-title">Recognise your colours.</h2>
        </div>
        <p>
          Colour marks an established partnership.
          <br />
          Grey crests are directory listings, not partners yet.
        </p>
      </div>
      <nav className={s.jumpLinks} aria-label="Jump to institution group">
        <span>Jump to</span>
        {visibleGroups.map((group) => (
          <a key={group.id} href={`#group-${group.id}`}>
            {group.title}
            <span aria-hidden="true"> ↓</span>
          </a>
        ))}
      </nav>
      <div className={s.controls}>
        <label className={s.search}>
          Find an institution
          <input
            type="search"
            placeholder="Name, team or location"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </label>
        <label className={s.level}>
          Institution type
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
            }}
          >
            <option value="all">All institution types</option>
            <option value="primary">Primary schools</option>
            <option value="high">High schools</option>
            <option value="university">Universities</option>
            <option value="club">Clubs</option>
          </select>
        </label>
        <div className={s.filters} aria-label="Partnership filter">
          <button
            type="button"
            aria-pressed={!partnersOnly}
            onClick={() => {
              setPartnersOnly(false);
            }}
          >
            All institutions <span>{institutions.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={partnersOnly}
            onClick={() => {
              setPartnersOnly(true);
            }}
          >
            Partners <span>{institutions.filter((s) => s.partner).length}</span>
          </button>
        </div>
      </div>
      <p className={s.resultCount} role="status">
        {rows.length} {rows.length === 1 ? "institution" : "institutions"}
      </p>
      {visibleGroups.map((group) => {
        const members = group.members;
        return (
          <section
            key={group.id}
            className={s.group}
            aria-labelledby={`group-${group.id}`}
          >
            <div className={s.groupHeading}>
              <h3 id={`group-${group.id}`}>{group.title}</h3>
              <span>{members.length}</span>
            </div>
            <div className={s.grid}>
              {members.map((school) => (
                <article
                  key={school.slug}
                  className={`${s.school} ${school.partner ? s.partner : ""}`}
                >
                  <div className={s.crest}>
                    <img
                      src={school.logo}
                      alt={`${school.name} crest`}
                      style={organisationLogoStyle(school.logo)}
                      width="120"
                      height="120"
                      loading="lazy"
                      className={school.partner ? s.colour : s.grey}
                    />
                  </div>
                  <h4>
                    {websiteLinks[school.slug] ? (
                      <a
                        className={s.schoolWebsite}
                        href={websiteLinks[school.slug]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${school.name} website (opens in a new tab)`}
                      >
                        {school.name}
                      </a>
                    ) : (
                      school.name
                    )}
                  </h4>
                  <p>
                    {school.typeLabel ||
                      (school.levels.length === 2
                        ? "Primary & high school"
                        : school.levels[0] === "primary"
                          ? "Primary school"
                          : "High school")}
                    {school.location ? ` · ${school.location}` : ""}
                  </p>
                  <span
                    className={
                      school.partner ? s.partnerLabel : s.directoryLabel
                    }
                  >
                    {school.partner
                      ? "✓ Established partner"
                      : "Directory listing"}
                  </span>
                  {websiteLinks[school.slug] && (
                    <span className={s.visitWebsite} aria-hidden="true">
                      Visit website ↗
                    </span>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {!rows.length && (
        <div className={s.empty}>
          <h3>No institutions found</h3>
          <p>Try another name or location.</p>
          <button
            onClick={() => {
              setQuery("");
              setPartnersOnly(false);
              setLevel("all");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
