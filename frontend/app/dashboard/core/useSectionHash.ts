"use client";
import { useEffect, useState } from "react";
/** URL-backed section selection, including browser back/forward and legacy links. */
export function useSectionHash(allowed: readonly string[], fallback: string) {
  const [section, setSection] = useState(fallback);
  const key = allowed.join("|");
  useEffect(() => {
    const sync = () => {
      const value = window.location.hash.slice(1);
      setSection(key.split("|").includes(value) ? value : fallback);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [key, fallback]);
  function select(value: string) {
    setSection(value);
    window.location.hash = value;
  }
  return [section, select] as const;
}
