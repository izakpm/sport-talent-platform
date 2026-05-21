
'use client';

import { useState, type CSSProperties } from 'react';

import { useRouter } from 'next/navigation';
import { theme } from '../styles/theme';

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const isFormValid =
    role && email && password && firstName && lastName;
  const isGoogleReady = Boolean(role);

  const handleGoogleAuth = () => {
    if (!role) {
      alert('Please select a role before continuing with Google.');
      return;
    }

    const query = `?state=${encodeURIComponent(role)}`;
    window.location.href = `http://localhost:3000/auth/google${query}`;
  };

  const register = async () => {
    if (!isFormValid) return;

    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        role,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!res.ok) {
      alert('Registration failed');
      return;
    }

    alert('Account created ✅');

    // ✅ Move user to login
    router.push('/login');
  };

  return (
    <div style={styles.container}>
      
      {/* ✅ Overlay */}
      <div style={styles.overlay}></div>

      {/* ✅ LOGIN BUTTON TOP RIGHT */}
      <div style={styles.topRight}>
        <button
          style={styles.loginBtn}
          onClick={() => router.push('/login')}
          onMouseOver={(e) =>
            (e.currentTarget.style.background = theme.colors.primary)
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.background = theme.colors.card)
          }
        >
          Login
        </button>
      </div>

      {/* ✅ LEFT (Brand) */}
      <div style={styles.left}>
        <h1 style={styles.brandName}>VeriPlay</h1>

        <h2 style={styles.tagline}>
          Where performance meets proof.
        </h2>

        <p style={styles.brandText}>
          Build your verified athlete profile, track performance,
          and connect with coaches, scouts, and organisations.
        </p>

        <p style={styles.brandSubText}>
          A trusted platform for athletes and professionals in sport.
        </p>
      </div>

      {/* ✅ RIGHT (Form) */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create your account</h2>

          <button
            type="button"
            style={{
              ...styles.googleButton,
              opacity: isGoogleReady ? 1 : 0.55,
              cursor: isGoogleReady ? 'pointer' : 'not-allowed',
            }}
            onClick={handleGoogleAuth}
            disabled={!isGoogleReady}
          >
            Continue with Google
          </button>

          {!isGoogleReady && (
            <p style={styles.googleHint}>
              Select a role above before signing up with Google.
            </p>
          )}

          {/* ✅ Role */}
          <div style={styles.roleContainer}>
            {['ATHLETE', 'COACH', 'GUARDIAN', 'ORG'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  ...styles.roleButton,
                  background:
                    role === r
                      ? theme.colors.primary
                      : theme.colors.accent,
                  color:
                    role === r
                      ? theme.colors.white
                      : theme.colors.textPrimary,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* ✅ Inputs */}
          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

          {/* ✅ Submit */}
          <button
            style={{
              ...styles.submit,
              background: isFormValid
                ? theme.colors.primary
                : theme.colors.border,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
            onClick={register}
            disabled={!isFormValid}
          >
            Create Account
          </button>
        </div>
      </div>

      {/* ✅ PARTNER RIBBON */}   
      <div style={styles.ribbon}>
        <div style={styles.logoRow}>
          <img src="/Virseker.png" alt="Virseker" style={styles.logo} />
          <img src="/Bulperd.png" alt="Bulperd" style={styles.logo} />
          <img src="/SuperSportSchools.png" alt="SuperSportSchools" style={styles.logo} />
        </div>
      </div>
    </div>
  );
}

/* ✅ STYLES */

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    position: 'relative',
  },

  logo: {
    height: 60,
    objectFit: 'contain' as const,
    filter: 'opacity(0.85)', // ✅ subtle blend into background
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.colors.overlay,
  },

  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 40,
  },

  topRight: {
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 2,
  },

  loginBtn: {
    padding: '10px 18px',
    borderRadius: 10,
    border: 'none',
    background: theme.colors.card,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  left: {
    flex: 1,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    padding: 60,
    zIndex: 1,
  },

  right: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },

  brandName: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  tagline: {
    fontSize: 22,
    marginBottom: 20,
  },

  brandText: {
    fontSize: 18,
    maxWidth: 420,
    marginBottom: 10,
  },

  brandSubText: {
    fontSize: 14,
    color: '#94a3b8',
  },

  card: {
    background: theme.colors.card,
    padding: 30,
    width: 360,
    borderRadius: 12,
    boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
  },

  title: {
    textAlign: 'center' as const,
    marginBottom: 20,
  },

  roleContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    padding: 12,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  input: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
  },

  submit: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    border: 'none',
    color: theme.colors.white,
    fontWeight: 'bold',
  },

  googleButton: {
    width: '100%',
    padding: 14,
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: theme.colors.white,
    color: '#111827',
    fontWeight: 'bold',
    marginBottom: 12,
  },

  googleHint: {
    marginTop: -6,
    marginBottom: 16,
    color: theme.colors.textMuted,
    fontSize: 13,
  },

  ribbon: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center', // ✅ center horizontally
    alignItems: 'center',
    gap: 30,
    padding: '20px 0',
    background: 'transparent', // ✅ transparent
  },

  ribbonText: {
    fontWeight: 'bold',
    color: theme.colors.textMuted,
  },

  logoBox: {
    width: 80,
    height: 30,
    background: theme.colors.border,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
  },
};