import type { CSSProperties } from "react";
// Official reverse (white) logos need a dark backing on the directory's white cards.
export function organisationLogoStyle(src: string): CSSProperties {
  return ["/clubs/stormers.png", "/clubs/sharks.png"].includes(src)
    ? {
        background: "#0b1f2e",
        borderRadius: 6,
        padding: 4,
        boxSizing: "border-box",
      }
    : {};
}
