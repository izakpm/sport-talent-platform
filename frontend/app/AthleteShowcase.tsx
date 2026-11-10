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
  const [view, setView] = useState("profile");
  return (
    <div className={styles.preview}>
      <div className={styles.topline}>
        <span>ATHLETE PROFILE</span>
        <span>Interactive example</span>
      </div>
      <div className={styles.identity}>
        <div className={styles.avatar}>IM</div>
        <div>
          <h3>Izak Meyer</h3>
          <p>Rugby &middot; Eighth man</p>
        </div>
        <b className={styles.shirt}>08</b>
      </div>
      <div className={styles.tabs} aria-label="Athlete example views">
        {[
          ["profile", "Profile"],
          ["performance", "Performance"],
          ["achievements", "Achievements"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            aria-pressed={view === key}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className={`${styles.content} ${styles.athleteContent}`}
        aria-live="polite"
      >
        {view === "profile" && (
          <>
            <p className={styles.caption}>THE PLAYER BEHIND THE NUMBER</p>
            <dl className={styles.details}>
              <div>
                <dt>Sport</dt>
                <dd>Rugby</dd>
              </div>
              <div>
                <dt>Primary position</dt>
                <dd>Eighth man</dd>
              </div>
              <div>
                <dt>Other positions</dt>
                <dd>Flanker</dd>
              </div>
            </dl>
          </>
        )}
        {view === "performance" && (
          <>
            <p className={styles.caption}>STRENGTH, SPEED & FITNESS</p>
            <dl className={styles.metrics}>
              {[
                ["Bench press", "kg"],
                ["Squat", "kg"],
                ["40 m sprint", "seconds"],
                ["Bronco test", "min:sec"],
              ].map(([name, unit]) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>
                    <strong aria-label="No result recorded">&mdash;</strong>
                    <span>{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.metricNote}>Results not yet added.</p>
          </>
        )}
        {view === "achievements" && (
          <>
            <p className={styles.caption}>REPRESENTATIVE HONOURS</p>
            <ul className={styles.achievements}>
              <li>
                <span>U13</span>
                <div>
                  <h4>Blue Bull U13 Academy week</h4>
                  <p>Academy week</p>
                </div>
              </li>
              <li>
                <span>U15</span>
                <div>
                  <h4>Blue Bulls U15 Invitational Team</h4>
                  <p>Invitational team</p>
                </div>
              </li>
            </ul>
          </>
        )}
      </div>
      <div className={styles.footnote}>
        Profile preview. Explore the tabs to see the sporting record.
      </div>
    </div>
  );
}
