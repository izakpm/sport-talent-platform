import Link from "next/link";
import styles from "./landing.module.css";
export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div>
        <Link href="/" className={styles.brand}>
          <img src="/brand-icon.svg" alt="" width="30" height="30" />
          PlayVerified
        </Link>
        <p>Where performance meets proof.</p>
        <small>Operated by Bulperd (Pty) Ltd · South Africa</small>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/register">Create an account</Link>
        <Link href="/login">Log in</Link>
        <Link href="/privacy">Privacy policy</Link>
        <a href="mailto:info@bulperd.com">Contact us</a>
      </nav>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} PlayVerified</span>
        <span>Start with the team. Build towards the future.</span>
      </div>
    </footer>
  );
}
