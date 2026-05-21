import Link from 'next/link';
import type { CSSProperties } from 'react';

export default function Home() {
  return (
    <div style={styles.container}>
      <div style={styles.overlay} />

      <div style={styles.topRight}>
        <Link href="/login" style={styles.loginBtn}>
          Login
        </Link>
      </div>

      <div style={styles.left}>
        <div>
          <h1 style={styles.brandName}>VeriPlay</h1>
          <p style={styles.tagline}>Where performance meets proof.</p>
          <p style={styles.brandText}>
            Build your verified athlete profile, track performance, and connect with coaches, scouts, and organisations.
          </p>
          <p style={styles.brandSubText}>
            A trusted platform for athletes and professionals in sport.
          </p>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create your account</h2>

          <div style={styles.roleContainer}>
            {['ATHLETE', 'COACH', 'GUARDIAN', 'ORG'].map((role) => (
              <button key={role} type="button" style={styles.roleButton}>
                {role}
              </button>
            ))}
          </div>

          <input style={styles.input} placeholder="Email" />
          <input style={styles.input} type="password" placeholder="Password" />
          <input style={styles.input} placeholder="First Name" />
          <input style={styles.input} placeholder="Last Name" />

          <Link href="/register" style={styles.submit}>
            Create Account
          </Link>

          <p style={styles.linkText}>
            Already have an account?{' '}
            <Link href="/login" style={styles.link}>
              Login
            </Link>
          </p>
        </div>
      </div>

      <div style={styles.ribbon}>
        <img src="/Virseker.png" alt="Virseker" style={styles.logo} />
        <img src="/Bulperd.png" alt="Bulperd" style={styles.logo} />
        <img src="/SuperSportSchools.png" alt="SuperSportSchools" style={styles.logo} />
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    color: '#ffffff',
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(8, 22, 33, 0.82) 0%, rgba(6, 27, 45, 0.58) 100%)',
    zIndex: 0,
  },

  topRight: {
    position: 'absolute',
    top: 24,
    right: 32,
    zIndex: 2,
  },

  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 22px',
    borderRadius: 999,
    background: '#ffffff',
    color: '#0f172a',
    textDecoration: 'none',
    fontWeight: 700,
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
  },

  left: {
    zIndex: 1,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    padding: '72px 64px',
    maxWidth: '55%',
  },

  brandName: {
    fontSize: 64,
    lineHeight: 1,
    margin: 0,
    fontWeight: 900,
    letterSpacing: '-0.04em',
  },

  tagline: {
    fontSize: 28,
    marginTop: 20,
    marginBottom: 24,
    maxWidth: 560,
    color: '#e2e8f0',
  },

  brandText: {
    fontSize: 18,
    maxWidth: 520,
    lineHeight: 1.8,
    color: '#cbd5e1',
    marginBottom: 18,
  },

  brandSubText: {
    fontSize: 14,
    color: '#94a3b8',
    maxWidth: 520,
  },

  right: {
    zIndex: 1,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '72px 64px',
  },

  card: {
    width: 380,
    padding: 32,
    borderRadius: 28,
    backdropFilter: 'blur(18px)',
    background: 'rgba(15, 23, 42, 0.74)',
    boxShadow: '0 48px 120px rgba(15, 23, 42, 0.28)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },

  title: {
    margin: 0,
    marginBottom: 24,
    fontSize: 26,
    fontWeight: 700,
    color: '#ffffff',
    textAlign: 'center' as const,
  },

  roleContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    marginBottom: 24,
  },

  roleButton: {
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.16)',
    background: 'rgba(255,255,255,0.08)',
    color: '#f8fafc',
    fontWeight: 700,
    cursor: 'pointer',
  },

  input: {
    width: '100%',
    padding: '14px 16px',
    marginBottom: 14,
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.08)',
    color: '#f8fafc',
    outline: 'none',
  },

  submit: {
    display: 'inline-flex',
    width: '100%',
    justifyContent: 'center',
    padding: '14px 16px',
    borderRadius: 14,
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
    textDecoration: 'none',
    marginTop: 8,
  },

  linkText: {
    marginTop: 18,
    fontSize: 14,
    textAlign: 'center' as const,
    color: '#cbd5e1',
  },

  link: {
    color: '#ffffff',
    textDecoration: 'underline',
  },

  ribbon: {
    zIndex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    padding: '20px 0',
    marginTop: 'auto',
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },

  logo: {
    height: 56,
    objectFit: 'contain' as const,
    filter: 'brightness(0.95)',
  },
};