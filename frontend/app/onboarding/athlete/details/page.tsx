'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../../styles/theme';
import { fetchWithAuth } from '../../../lib/api';

export default function AthleteDetails() {
  const router = useRouter();

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!dateOfBirth || !gender) {
      alert('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');

      if (!user?.id || !token) {
        alert('Session error. Please login again.');
        return;
      }

      // ✅ STEP 1 — UPDATE USER
      await fetchWithAuth(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          date_of_birth: dateOfBirth,
          gender,
          phone,
        }),
      });

      // ✅ STEP 2 — CREATE ATHLETE PROFILE
      const profileRes = await fetchWithAuth('/athletes/profile', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          nationality: 'South Africa',
          province: 'Gauteng',
        }),
      });

      if (!profileRes?.ok) {
        alert('Failed to create athlete profile');
        return;
      }

      const athlete = await profileRes.json();

      // ✅ SAVE athlete_id for later use
      localStorage.setItem('athlete_id', athlete.id);

      // ✅ STEP 3 — SAVE SPORTS (FROM STEP 1)
      const selectedSport = localStorage.getItem('onboarding_sport');
      const selectedPositions = JSON.parse(
        localStorage.getItem('onboarding_positions') || '[]'
      );

      if (selectedSport && selectedPositions.length > 0) {
          await fetchWithAuth('/athletes/sports', {
            method: 'POST',
            body: JSON.stringify({
              athlete_id: athlete.id,
              sports: selectedPositions.map((posId: string, index: number) => ({
                sport_id: selectedSport,
                position_id: posId,
                is_primary: index === 0,
              })),
            }),
          });
        }

      // ✅ DONE → Dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error(err);
      alert('Error completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.content}>
        <div style={styles.card}>

          <p style={styles.step}>Step 2 of 2</p>

          <h1 style={styles.title}>Personal Details</h1>

          <p style={styles.subtitle}>
            Tell us a little more about yourself
          </p>

          {/* ✅ Date of Birth */}
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            style={styles.input}
          />

          {/* ✅ Gender */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              ...styles.input,
              color: gender
                ? theme.colors.textPrimary
                : theme.colors.textMuted,
            }}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          {/* ✅ Phone */}
          <input
            placeholder="Phone Number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
          />

          {/* ✅ Submit */}
          <button
            style={styles.submit}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>

        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    height: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.colors.overlay,
  },

  content: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    background: theme.colors.card,
    padding: 35,
    width: 420,
    borderRadius: 14,
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },

  step: {
    textAlign: 'center',
    fontSize: 13,
    color: theme.colors.textMuted,
  },

  title: {
    ...theme.typography.heading,
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.colors.textMuted,
  },

  input: {
    width: '100%',
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },

  submit: {
    width: '100%',
    padding: 14,
    background: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};