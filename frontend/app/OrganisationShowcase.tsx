import Image from "next/image";
import organisationImage from "../public/Schools & Clubs.png";
import FlipShowcase from "./FlipShowcase";
import { OrganisationPreview } from "./AudiencePreview";
import styles from "./audience.module.css";

export default function OrganisationShowcase() {
  return (
    <FlipShowcase
      audience="Schools and clubs"
      photo={
        <Image
          src={organisationImage}
          alt="Rugby players in action with yellow SCHOOLS AND CLUBS lettering"
          className={styles.athleteImage}
          sizes="(max-width: 760px) 88vw, (max-width: 1370px) 43vw, 570px"
        />
      }
    >
      <OrganisationPreview />
    </FlipShowcase>
  );
}
