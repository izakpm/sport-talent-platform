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
        <div className={styles.navActions}>
          <Link className={styles.loginLink} href="/login">Log in</Link>
          <Link className={styles.registerLink} href="/register">
            Register
          </Link>
        </div>
      </div>
    </header>
  );
}
