'use client';

import { useState } from 'react';

export default function RegisterPage() {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const register = async () => {
    if (!role || !email || !password || !firstName || !lastName) {
      alert('Please complete all fields');
      return;
    }

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

    const data = await res.json();

    // ✅ Save user
    localStorage.setItem('user', JSON.stringify(data));

    // ✅ Redirect based on role
    if (data.role === 'ATHLETE') {
      window.location.href = '/onboarding/athlete';
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div style={styles.container}>
      
      {/* ✅ Overlay */}
      <div style={styles.overlay}></div>

      {/* ✅ LEFT SIDE (Branding) */}
      <div style={styles.left}>
        <h1 style={styles.brandName}>VeriPlay</h1>

        <h2 style={styles.tagline}>
          Where performance meets proof.
        </h2>

        <p style={styles.brandText}>
          Build your verified athlete profile, track performance, and connect
          with coaches, scouts, and organisations.
        </p>

        <p style={styles.brandSubText}>
          A trusted platform for athletes and professionals in sport.
        </p>
      </div>

      {/* ✅ RIGHT SIDE (Form) */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create your account</h2>

          {/* ✅ Role selection */}
          <div style={styles.roleContainer}>
            {['ATHLETE', 'COACH', 'GUARDIAN', 'ORG'].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  ...styles.roleButton,
                  backgroundColor: role === r ? '#1f6f8b' : '#e5e7eb',
                  color: role === r ? '#fff' : '#111',
                }}
                onMouseOver={(e) => {
                  if (role !== r) e.currentTarget.style.background = '#d1d5db';
                }}
                onMouseOut={(e) => {
                  if (role !== r) e.currentTarget.style.background = '#e5e7eb';
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
            style={styles.submit}
            onClick={register}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = '#155e75')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = '#1f6f8b')
            }
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background:
      'linear-gradient(to right, rgba(11,31,46,0.7), rgba(11,31,46,0.3))',
    zIndex: 0,
  },

  left: {
    flex: 1,
    color: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    padding: 60,
    position: 'relative',
    zIndex: 1,
  },

  right: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },

  brandName: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    marginBottom: 10,
  },

  tagline: {
    fontSize: 22,
    fontWeight: 500,
    marginBottom: 20,
    color: '#e2e8f0',
  },

  brandText: {
    fontSize: 18,
    maxWidth: 420,
    lineHeight: 1.6,
    color: '#cbd5f5',
    marginBottom: 10,
  },

  brandSubText: {
    fontSize: 14,
    color: '#94a3b8',
  },

  card: {
    background: '#ffffff',
    padding: 30,
    width: 360,
    borderRadius: 12,
    boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
  },

  title: {
    textAlign: 'center' as const,
    marginBottom: 20,
    color: '#111',
  },

  roleContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },

  roleButton: {
    padding: 12,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: '0.2s',
  },

  input: {
    width: '100%',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid #ccc',
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },

  submit: {
    width: '100%',
    padding: 14,
    background: '#1f6f8b',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    marginTop: 10,
    transition: '0.2s',
  },
};