"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./audience.module.css";

export default function FlipShowcase({
  audience,
  photo,
  children,
}: {
  audience: string;
  photo: ReactNode;
  children: ReactNode;
}) {
  const [flipped, setFlipped] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={root}
      className={styles.showcase}
      role="region"
      aria-label={`${audience} showcase`}
      tabIndex={0}
      aria-description="Hover or press Enter to explore the interactive example. Press Escape to return to the photo."
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setFlipped(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setFlipped(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFlipped(false);
      }}
      onKeyDown={(event) => {
        if (
          event.key === "Escape" ||
          (event.target === event.currentTarget &&
            (event.key === "Enter" || event.key === " "))
        ) {
          event.preventDefault();
          root.current?.focus();
          setFlipped(event.key === "Escape" ? false : !flipped);
        }
      }}
    >
      <div className={styles.flipStage} data-flipped={flipped}>
        <div
          className={`${styles.flipFace} ${styles.flipFront}`}
          aria-hidden={flipped}
          inert={flipped}
          onClick={() => {
            root.current?.focus();
            setFlipped(true);
          }}
        >
          {photo}
        </div>
        <div
          className={`${styles.flipFace} ${styles.flipBack}`}
          aria-hidden={!flipped}
          inert={!flipped}
        >
          <button
            className={styles.flipClose}
            type="button"
            aria-label={`Return to ${audience.toLowerCase()} photo`}
            onClick={() => {
              root.current?.focus();
              setFlipped(false);
            }}
          >
            &times;
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
