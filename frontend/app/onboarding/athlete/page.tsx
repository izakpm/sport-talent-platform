'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../styles/theme';

export default function AthleteOnboarding() {
  const router = useRouter();

  const [sports, setSports] = useState<any[]>([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [positions, setPositions] = useState<any[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load sports
  useEffect(() => {
    fetch('http://localhost:3000/sports')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSports(data);
        else if (data.data) setSports(data.data);
        else if (data.sports) setSports(data.sports);
        else setSports([]);
      });
  }, []);

  // ✅ Load positions
  useEffect(() => {
    if (!selectedSport) return;

    fetch(`http://localhost:3000/positions/${selectedSport}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPositions(data);
        else if (data.data) setPositions(data.data);
        else if (data.positions) setPositions(data.positions);
        else setPositions([]);
      });
  }, [selectedSport]);

  // ✅ CONTINUE BUTTON LOGIC (FIXED)
  const handleContinue = async () => {
    if (!selectedSport) {
      alert('Please select a sport');
      return;
    }

    if (selectedPositions.length === 0) {
      alert('Please select at least one position');
      return;
    }

    setLoading(true);

    try {
      // ✅ Store selections for next step (IMPORTANT FIX)
      localStorage.setItem('onboarding_sport', selectedSport);
      localStorage.setItem(
        'onboarding_positions',
        JSON.stringify(selectedPositions)
      );

      // ✅ Go to step 2
      router.push('/onboarding/athlete/details');

    } catch (err) {
      console.error(err);
      alert('Error saving data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.content}>
        <div style={styles.card}>

          <p style={styles.step}>Step 1 of 2</p>

          <h1 style={styles.title}>Select Your Sport</h1>

          <p style={styles.subtitle}>
            Start by choosing your primary sport and positions
          </p>

          {/* ✅ Sport Dropdown */}
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value);
              setSelectedPositions([]);
            }}
            style={{
              ...styles.select,
              color: selectedSport
                ? theme.colors.textPrimary
                : theme.colors.textMuted,
            }}
          >
            <option value="">Choose a sport</option>

            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>

          {/* ✅ Positions */}
          {positions.length > 0 && (
            <>
              <h3 style={styles.positionsTitle}>Select Positions</h3>

              <div style={styles.positionsContainer}>
                {positions.map((pos) => {
                  const isSelected = selectedPositions.includes(pos.id);

                  return (
                    <button
                      key={pos.id}
                      onClick={() => {
                        setSelectedPositions((prev) =>
                          prev.includes(pos.id)
                            ? prev.filter((id) => id !== pos.id)
                            : [...prev, pos.id]
                        );
                      }}
                      style={{
                        ...styles.positionButton,
                        background: isSelected
                          ? theme.colors.primary
                          : theme.colors.inputBackground,
                        color: isSelected
                          ? theme.colors.white
                          : theme.colors.textPrimary,
                      }}
                    >
                      {pos.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ✅ Continue Button */}
          <button
            style={styles.submit}
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue'}
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
    width: 440,
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

  select: {
    width: '100%',
    padding: 14,
    marginBottom: 20,
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
  },

  positionsTitle: {
    marginBottom: 10,
    ...theme.typography.subheading,
  },

  positionsContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },

  positionButton: {
    padding: 10,
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
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