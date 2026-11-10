"use client";
import Image from "next/image";
import coachImage from "../public/Coach.png";
import ShowcaseCarousel from "./ShowcaseCarousel";
import HomePreview from "./HomePreview";
import styles from "./audience.module.css";
export default function CoachShowcase() {
  return (
    <ShowcaseCarousel
      audience="Coach"
      dark
      slides={[
        {
          name: "Coach photo",
          label: "Photo",
          content: (
            <Image
              src={coachImage}
              alt="Rugby coach beside yellow COACH lettering"
              className={styles.athleteImage}
              sizes="(max-width: 760px) 88vw, (max-width: 1370px) 43vw, 570px"
            />
          ),
        },
        {
          name: "Monthly plan",
          label: "Schedule",
          content: <HomePreview fixedView="schedule" />,
        },
        {
          name: "Team roster",
          label: "Roster",
          content: <HomePreview fixedView="roster" />,
        },
      ]}
    />
  );
}
