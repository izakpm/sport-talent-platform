"use client";
import Image from "next/image";
import athleteImage from "../public/Athlete.png";
import FlipShowcase from "./FlipShowcase";
import { useState } from "react";
import styles from "./audience.module.css";
export default function AthleteShowcase() {
  return (
    <FlipShowcase
      audience="Athlete"
      photo={
        <Image
          src={athleteImage}
          alt="Rugby athlete in a red scrum cap beside yellow ATHLETES lettering"
          className={styles.athleteImage}
          sizes="(max-width: 760px) 88vw, (max-width: 1370px) 43vw, 570px"
        />
      }
    >
      <AthleteExample />
    </FlipShowcase>
  );
}

function AthleteExample() {
  const [performance, setPerformance] = useState(false);
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
      <div className={styles.tabs}>
        <button
          type="button"
          aria-pressed={!performance}
          onClick={() => setPerformance(false)}
        >
          Sporting profile
        </button>
        <button
          type="button"
          aria-pressed={performance}
          onClick={() => setPerformance(true)}
        >
          Performance record
        </button>
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
