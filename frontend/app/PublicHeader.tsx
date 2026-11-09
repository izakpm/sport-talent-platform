import Link from "next/link";
import styles from "./home.module.css";
export default function PublicHeader() {
  return (
    <header className={styles.header}>
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
          <Link href="/#athletes">Athletes</Link>
          <Link href="/#how-it-works">Coaches</Link>
          <Link href="/#schools-clubs">Schools & Clubs</Link>
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
