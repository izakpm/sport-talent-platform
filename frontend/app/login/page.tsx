'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../styles/theme';
import { API_URL } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isFormValid = email && password;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    // Log the API URL so we can debug failed fetches from the browser
    // (helps confirm the client is calling the expected backend)
    console.log('API_URL (client):', API_URL);

    if (!token) return;

    const processGoogleLogin = async () => {
      localStorage.setItem('token', token);

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Unable to verify Google session');
        }

        const user = await res.json();
        localStorage.setItem('user', JSON.stringify({ id: user.userId, email: user.email, role: user.role }));
        router.push('/dashboard');
      } catch (err) {
        console.error('Google login failed', err);
      } finally {
        params.delete('token');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      }
    };

    processGoogleLogin();
  }, [router]);

  const handleGoogleAuth = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleLogin = async () => {
    if (!isFormValid) return;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      // First try direct backend URL (from env). If that fails (network/CORS),
      // fall back to a relative path which Next dev can proxy via rewrites.
      let res: Response | null = null;
      try {
        res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
      } catch (e) {
        console.warn('Direct API fetch failed, trying proxy /auth/login', e);
        res = await fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });
      }

      if (!res.ok) {
        // Surface API status for easier debugging
        const text = await res.text().catch(() => null);
        console.error('Login failed', { status: res.status, text });
        alert('Invalid credentials');
        return;
      }

      const data = await res.json();

      // ✅ Save session
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // ✅ Go to dashboard (send SCHOOL users to the schools dashboard)
      const destination = data.user?.role === 'SCHOOL' ? '/dashboard/schools' : '/dashboard';
      router.push(destination);

    } catch (err: any) {
      console.error('Login request error', err);
      alert(`Network error contacting backend: ${err?.message ?? err}. Check console for details. API_URL=${API_URL}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.topRight}>
        <button
          style={styles.registerBtn}
          onClick={() => router.push('/register')}
        >
          Register
        </button>
      </div>

      {/* ✅ LEFT (Branding SAME AS REGISTER) */}
      <div style={styles.left}>
        <img src="/PlayVerified Logo.png" alt="PlayVerified" style={{ display: 'block', height: 200, marginBottom: 40, objectFit: 'contain', width: '100%', maxWidth: 300 }} />

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

      {/* ✅ RIGHT (LOGIN FORM) */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome back</h2>

          <button
            type="button"
            style={styles.googleButton}
            onClick={handleGoogleAuth}
          >
            <img
              src="/Google.png"
              alt="Google logo"
              style={styles.googleLogo}
            />
            Sign in with Google
          </button>

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

          <button
            style={{
              ...styles.submit,
              background: isFormValid
                ? theme.colors.primary
                : theme.colors.border,
              cursor: isFormValid ? 'pointer' : 'not-allowed',
            }}
            onClick={handleLogin}
            disabled={!isFormValid}
          >
            Login
          </button>

          {/* ✅ LINK BACK TO REGISTER */}
          <p style={styles.linkText}>
            Don't have an account?{' '}
            <span
              style={styles.link}
              onClick={() => router.push('/register')}
            >
              Register
            </span>
          </p>
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

/* ✅ SAME STYLE SYSTEM AS REGISTER */

const styles: Record<string, CSSProperties> = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.colors.overlay,
  },

  topRight: {
    position: 'absolute',
    top: 20,
    right: 32,
    zIndex: 2,
  },

  registerBtn: {
    padding: '12px 22px',
    borderRadius: 999,
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
    ...theme.typography.heading,
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
    marginBottom: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  googleLogo: {
    width: 18,
    height: 18,
  },

  linkText: {
    marginTop: 15,
    textAlign: 'center' as const,
    color: theme.colors.textMuted,
  },

  link: {
    color: theme.colors.primary,
    cursor: 'pointer',
    fontWeight: 'bold',
  },

  ribbon: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 0',
  },

  logoRow: {
    display: 'flex',
    gap: 40,
  },

  logo: {
    height: 60,
    objectFit: 'contain' as const,
    filter: 'opacity(0.85)', // ✅ subtle blend into background
  },
};
