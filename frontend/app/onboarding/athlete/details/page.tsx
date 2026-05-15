'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AthleteDetails() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Load existing user data (TEMP simulation)
  useEffect(() => {
    // ⚠️ In future: load from logged-in user
    setFirstName('Test');
    setLastName('Athlete');
  }, []);

  const handleSave = async () => {
    if (!firstName || !lastName) {
      alert('Please complete your details');
      return;
    }

    setLoading(true);

    try {
      // ⚠️ TEMP: Replace with real user_id later
      const user_id = 'PASTE-USER-ID-HERE';

      await fetch(`http://localhost:3000/users/${user_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
        }),
      });

      alert('Profile saved ✅');

      // ✅ DONE → go to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error(err);
      alert('Error saving details');
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

          {/* ✅ First Name */}
          <input
          style={{
              ...styles.input,
              color: firstName ? '#111' : '#6b7280',
          }}
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          />

          {/* ✅ Last Name */}   
          <input
          style={{
              ...styles.input,
              color: lastName ? '#111' : '#6b7280',
          }}
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          />

          {/* ✅ Phone */}
          <input
          style={{
              ...styles.input,
              color: phone ? '#111' : '#6b7280',
          }}
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          />

          {/* ✅ Save */}
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

const styles = {
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
    background:
      'linear-gradient(to right, rgba(11,31,46,0.7), rgba(11,31,46,0.3))',
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
    background: '#fff',
    padding: 35,
    width: 420,
    borderRadius: 14,
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },

  step: {
    textAlign: 'center',
    fontSize: 13,
    color: '#64748b',
  },

  title: {
    textAlign: 'center',
    fontSize: 26,
    marginBottom: 10,
  },

  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#475569',
  },

  
  input: {
    width: '100%',
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    fontSize: 15,
    backgroundColor: '#fff',
  },

  submit: {
    width: '100%',
    padding: 14,
    background: '#1f6f8b',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};