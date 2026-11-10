"use client";
import Image from "next/image";
import coachImage from "../public/Coach.png";
import FlipShowcase from "./FlipShowcase";
import HomePreview from "./HomePreview";
import styles from "./audience.module.css";
export default function CoachShowcase() {
  return (
    <FlipShowcase
      audience="Coach"
      photo={
        <Image
          src={coachImage}
          alt="Rugby coach beside yellow COACH lettering"
          className={styles.athleteImage}
          sizes="(max-width: 760px) 88vw, (max-width: 1370px) 43vw, 570px"
        />
      }
    >
      <HomePreview />
    </FlipShowcase>
  );
}
