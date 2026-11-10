"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import athleteImage from "../public/Athlete 2.png";
import styles from "./audience.module.css";

const slides = ["Photo", "Sporting profile", "Performance record"];

export default function AthleteShowcase() {
  const [slide, setSlide] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const move = (direction: number) =>
    setSlide(
      (current) => (current + direction + slides.length) % slides.length,
    );
  return (
    <div
      className={styles.showcase}
      role="region"
      aria-roledescription="carousel"
      aria-label="Athlete showcase"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
      <div
        className={styles.showcaseStage}
        onTouchStart={(event) => {
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
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5)
            move(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((name, index) => (
          <div
            key={name}
            className={styles.showcasePanel}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of 3: ${name}`}
            aria-hidden={slide !== index}
            inert={slide !== index}
            style={{ visibility: slide === index ? "visible" : "hidden" }}
          >
            {index === 0 ? (
              <Image
                src={athleteImage}
                alt="Rugby athlete in a red scrum cap beside yellow ATHLETE lettering"
                className={styles.athleteImage}
                sizes="(max-width: 760px) 88vw, (max-width: 1370px) 43vw, 570px"
              />
            ) : (
              <AthleteExample performance={index === 2} />
            )}
          </div>
        ))}
      </div>
      <div className={styles.showcaseControls}>
        <button
          type="button"
          className={styles.showcaseArrow}
          aria-label="Previous athlete slide"
          onClick={() => move(-1)}
        >
          ←
        </button>
        <div
          className={styles.showcaseChoices}
          aria-label="Choose an athlete slide"
        >
          {slides.map((name, index) => (
            <button
              type="button"
              key={name}
              aria-label={`Show ${name.toLowerCase()}`}
              aria-pressed={slide === index}
              onClick={() => setSlide(index)}
            >
              {["Photo", "Profile", "Performance"][index]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.showcaseArrow}
          aria-label="Next athlete slide"
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
      <p className={styles.showcaseHint} aria-live="polite" aria-atomic="true">
        {slide + 1} / 3 · {slides[slide]}
        {slide === 0 ? " · Explore the examples" : " · Sample data"}
      </p>
    </div>
  );
}

function AthleteExample({ performance }: { performance: boolean }) {
  return (
    <div className={styles.preview}>
      <div className={styles.topline}>
        <span>{performance ? "PERFORMANCE RECORD" : "ATHLETE PROFILE"}</span>
        <span>Illustrative preview</span>
      </div>
      <div className={styles.identity}>
        <div className={styles.avatar}>TM</div>
        <div>
          <h3>Thabo M.</h3>
          <p>Rugby · Scrum-half</p>
          <span>Sample athlete</span>
        </div>
        <b className={styles.shirt}>09</b>
      </div>
      <div className={styles.content}>
        {performance ? (
          <>
            <p className={styles.caption}>PLANNED PERFORMANCE & VERIFICATION</p>
            <div className={styles.result}>
              <div>
                <span>40 m sprint</span>
                <strong>
                  5.4 <small>seconds</small>
                </strong>
              </div>
              <span className={styles.pending}>Awaiting review</span>
            </div>
            <ol className={styles.workflow}>
              <li>
                <b>1</b>Record a performance
              </li>
              <li>
                <b>2</b>Request coach verification
              </li>
              <li>
                <b>3</b>Add it to your sporting record
              </li>
            </ol>
          </>
        ) : (
          <>
            <p className={styles.caption}>THE PLAYER BEHIND THE NUMBER</p>
            <dl className={styles.details}>
              <div>
                <dt>Sport</dt>
                <dd>Rugby</dd>
              </div>
              <div>
                <dt>Primary position</dt>
                <dd>Scrum-half</dd>
              </div>
              <div>
                <dt>Other position</dt>
                <dd>Fly-half</dd>
              </div>
            </dl>
            <p className={styles.note}>
              Start with your sport and positions. Build your sporting story
              from there.
            </p>
          </>
        )}
      </div>
      <div className={styles.footnote}>
        {performance
          ? "Sample data. Performance records and coach verification are in development."
          : "Sample profile. Create your account to start setting up your own sport and positions."}
      </div>
    </div>
  );
}
