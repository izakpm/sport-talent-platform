"use client";
import { useState } from "react";
import schools from "./schools.json";
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
  const rows = schools
    .filter(
      (school) =>
        (!partnersOnly || school.partner) &&
        (level === "all" || school.levels.includes(level)) &&
        normalise(
          `${school.name} ${school.location} ${school.province}`,
        ).includes(normalise(query.trim())),
    )
    .sort(
      (a, b) =>
        Number(b.partner) - Number(a.partner) || a.name.localeCompare(b.name),
    );
  return (
    <section className={s.directory} aria-labelledby="directory-title">
      <div className={s.directoryHeading}>
        <div>
          <p className={s.eyebrow}>THE SCHOOL DIRECTORY</p>
          <h2 id="directory-title">Recognise your colours.</h2>
        </div>
        <p>
          Colour marks an established partnership.
          <br />
          Grey crests are directory listings, not partners yet.
        </p>
      </div>
      <div className={s.controls}>
        <label className={s.search}>
          Find a school
          <input
            type="search"
            placeholder="School, town or province"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
        </label>
        <label className={s.level}>
          School type
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
            }}
          >
            <option value="all">All school types</option>
            <option value="primary">Primary schools</option>
            <option value="high">High schools</option>
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
            All schools <span>{schools.length}</span>
          </button>
          <button
            type="button"
            aria-pressed={partnersOnly}
            onClick={() => {
              setPartnersOnly(true);
            }}
          >
            Partners <span>{schools.filter((s) => s.partner).length}</span>
          </button>
        </div>
      </div>
      <p className={s.resultCount} role="status">
        {rows.length} {rows.length === 1 ? "school" : "schools"}
      </p>
      <div className={s.grid}>
        {rows.map((school) => (
          <article
            key={school.slug}
            className={`${s.school} ${school.partner ? s.partner : ""}`}
          >
            <div className={s.crest}>
              <img
                src={school.logo}
                alt={`${school.name} crest`}
                width="120"
                height="120"
                loading="lazy"
                className={school.partner ? s.colour : s.grey}
              />
            </div>
            <h3>{school.name}</h3>
            <p>
              {school.levels.length === 2
                ? "Primary & high school"
                : school.levels[0] === "primary"
                  ? "Primary school"
                  : "High school"}
              {school.location ? ` · ${school.location}` : ""}
            </p>
            <span
              className={school.partner ? s.partnerLabel : s.directoryLabel}
            >
              {school.partner ? "✓ Established partner" : "School directory"}
            </span>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className={s.empty}>
          <h3>No schools found</h3>
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
