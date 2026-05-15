'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../styles/theme';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      router.push('/dashboard');
    }
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        alert('Invalid login credentials');
        return;
      }

      const user = await res.json();

      // ✅ Save session
      localStorage.setItem('token', user.access_token);
      localStorage.setItem('user', JSON.stringify(user.user));

      // ✅ Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Login error:', err);
      alert('Something went wrong');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.content}>

        {/* ✅ LEFT SIDE */}
        <div style={styles.left}>
          <h1 style={styles.brand}>VeriPlay</h1>

          <h2 style={styles.tagline}>
            Where performance meets proof.
          </h2>

          <p style={styles.description}>
            Build your verified athlete profile, track performance,
            and connect with coaches and scouts.
          </p>

          <p style={styles.subText}>
            A trusted platform for athletes and professionals in sport.
          </p>
        </div>

        {/* ✅ RIGHT SIDE */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome Back</h2>

          <input
            style={styles.input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            style={styles.input}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={styles.button} onClick={handleLogin}>
            Login
          </button>
        </div>

      </div>
    </div>
  );
}


/* ✅ STYLES */

const styles = {
  container: {
    height: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(to right, rgba(11,31,46,0.9), rgba(11,31,46,0.5))',
  },

  content: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    padding: '0 80px',
  },

  /* ✅ LEFT CONTENT */
  left: {
    maxWidth: 450,
    color: '#ffffff',
  },

  brand: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  tagline: {
    fontSize: 24,
    marginBottom: 15,
  },

  description: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 1.5,
  },

  subText: {
    fontSize: 14,
    opacity: 0.8,
  },

  /* ✅ RIGHT CARD */
  card: {
    background: theme.colors.card,
    padding: 30,
    borderRadius: 18,
    width: 350,
    boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#111',
  },

  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    border: '1px solid #ccc',
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },

  button: {
    width: '100%',
    padding: 12,
    background: '#1f6f8b',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};