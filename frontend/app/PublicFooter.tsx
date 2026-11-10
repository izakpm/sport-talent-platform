import Link from "next/link";
import styles from "./home.module.css";
export default function PublicFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerTop}>
        <div>
          <Link href="/" aria-label="PlayVerified home">
            <img
              src="/PlayVerified Logo.png"
              alt="PlayVerified"
              className={styles.logo}
              width="165"
              height="55"
            />
          </Link>
          <p>Where performance meets proof.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link scroll={false} href="/register">
            Create an account
          </Link>
          <Link scroll={false} href="/login">
            Log in
          </Link>
          <Link href="/privacy">Privacy policy</Link>
          <a href="mailto:info@bulperd.com">Contact us</a>
        </nav>
      </div>
      <div className={styles.footerBottom}>
        <span>© {new Date().getFullYear()} PlayVerified</span>
        <span>Operated by Bulperd (Pty) Ltd · South Africa</span>
      </div>
    </footer>
  );
}
