"use client";
import { useRef, useState, type ReactNode } from "react";
import styles from "./audience.module.css";
type Slide = { name: string; label: string; content: ReactNode };
export default function ShowcaseCarousel({
  audience,
  slides,
  dark = false,
}: {
  audience: string;
  slides: Slide[];
  dark?: boolean;
}) {
  const [slide, setSlide] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const move = (direction: number) =>
    setSlide(
      (current) => (current + direction + slides.length) % slides.length,
    );
  return (
    <div
      className={`${styles.showcase} ${dark ? styles.darkShowcase : ""}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${audience} showcase`}
      tabIndex={0}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("select, input, textarea"))
          return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div
        className={styles.showcaseStage}
        onTouchStart={(event) => {
          if (
            (event.target as HTMLElement).closest("select, input, button, a")
          ) {
            touchStart.current = null;
            return;
          }
          const touch = event.touches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchCancel={() => {
          touchStart.current = null;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x,
            dy = touch.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
            move(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((item, index) => (
          <div
            key={item.name}
            className={styles.showcasePanel}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}: ${item.name}`}
            aria-hidden={slide !== index}
            inert={slide !== index}
            style={{ visibility: slide === index ? "visible" : "hidden" }}
          >
            {item.content}
          </div>
        ))}
      </div>
      <div className={styles.showcaseControls}>
        <button
          type="button"
          className={styles.showcaseArrow}
          aria-label={`Previous ${audience.toLowerCase()} slide`}
          onClick={() => move(-1)}
        >
          ←
        </button>
        <div
          className={styles.showcaseChoices}
          aria-label={`Choose a ${audience.toLowerCase()} slide`}
        >
          {slides.map((item, index) => (
            <button
              type="button"
              key={item.name}
              aria-label={`Show ${item.name.toLowerCase()}`}
              aria-pressed={slide === index}
              onClick={() => setSlide(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.showcaseArrow}
          aria-label={`Next ${audience.toLowerCase()} slide`}
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
      <p className={styles.showcaseHint} aria-live="polite" aria-atomic="true">
        {slide + 1} / {slides.length} · {slides[slide].name}
        {slide === 0 ? " · Explore the examples" : " · Sample data"}
      </p>
    </div>
  );
}
