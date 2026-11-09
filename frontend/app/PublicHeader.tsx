import Link from "next/link";
import styles from "./home.module.css";
export default function PublicHeader({
  overlay = false,
}: {
  overlay?: boolean;
}) {
  return (
    <header
      className={`${styles.header} ${overlay ? styles.overlayHeader : ""}`}
    >
      <div className={styles.navInner}>
        <Link href="/" aria-label="PlayVerified home">
          <img
            src="/PlayVerified Logo.png"
            alt="PlayVerified"
            className={styles.logo}
            width="190"
            height="64"
          />
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#how-it-works">For coaches</Link>
          <Link href="/#our-vision">Our story</Link>
          <Link href="/#questions">FAQs</Link>
        </nav>
        <div className={styles.navActions}>
          <Link href="/login">Log in</Link>
          <Link className={styles.registerLink} href="/register">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
