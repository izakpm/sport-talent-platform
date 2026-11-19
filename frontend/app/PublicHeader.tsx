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
        <nav aria-label="Main navigation" className={styles.publicNavigation}>
          <Link href="/network">Our Network</Link>
        </nav>
        <div className={styles.navActions}>
          <Link scroll={false} className={styles.loginLink} href="/login">
            Log in
          </Link>
          <Link scroll={false} className={styles.registerLink} href="/register">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
