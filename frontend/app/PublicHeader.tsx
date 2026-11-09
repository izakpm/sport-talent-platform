import Link from "next/link";
import styles from "./landing.module.css";
export default function PublicHeader() {
  return (
    <header className={styles.nav}>
      <Link href="/" className={styles.brand}>
        <img src="/brand-icon.svg" alt="" width="34" height="34" />
        PlayVerified
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#our-vision">Our vision</Link>
        <Link href="/#questions">FAQs</Link>
      </nav>
      <div className={styles.navActions}>
        <Link href="/login">Log in</Link>
        <Link className={styles.buttonDark} href="/register">
          Get started <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
