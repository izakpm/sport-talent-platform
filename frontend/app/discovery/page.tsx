'use client';

import { useEffect, useState } from 'react';
import { theme } from '../styles/theme';
import { fetchWithAuth } from '../lib/api';
import { fetchAthleteDiscovery, fetchCoachDiscovery } from '../lib/api/discovery';

export default function DiscoveryPage() {
  const [query, setQuery] = useState('');
  const [sportId, setSportId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [sports, setSports] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSports = async () => {
      const res = await fetchWithAuth('/sports');
      const data = res?.ok ? await res.json() : [];
      setSports(Array.isArray(data) ? data : data?.data || []);
    };

    loadSports();
  }, []);

  useEffect(() => {
    if (!sportId) {
      setPositions([]);
      return;
    }

    const loadPositions = async () => {
      const res = await fetchWithAuth(`/positions/${sportId}`);
      const data = res?.ok ? await res.json() : [];
      setPositions(Array.isArray(data) ? data : data?.data || []);
    };

    loadPositions();
  }, [sportId]);


  const runSearch = async () => {
    setLoading(true);
    try {
      const athletesRes = await fetchAthleteDiscovery({
        sport_id: sportId || undefined,
        position_id: positionId || undefined,
        query: query || undefined,
        public_only: true,
      });
      const athleteResults = athletesRes ? await athletesRes.json() : [];

      const coachesRes = await fetchCoachDiscovery(query || undefined);
      const coachResults = coachesRes ? await coachesRes.json() : [];

      setAthletes(Array.isArray(athleteResults) ? athleteResults : []);
      setCoaches(Array.isArray(coachResults) ? coachResults : []);
    } catch (err) {
      console.error('Discovery search failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Talent Discovery</h1>

      <div style={styles.filters}>
        <input
          placeholder="Search athletes or coaches"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
        />

        <select
          value={sportId}
          onChange={(e) => setSportId(e.target.value)}
          style={styles.select}
        >
          <option value="">All Sports</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </select>

        <select
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
          style={styles.select}
          disabled={!sportId}
        >
          <option value="">All Positions</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>
              {position.name}
            </option>
          ))}
        </select>

        <button style={styles.button} onClick={runSearch} disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.section}>Athletes</h2>
          {athletes.length > 0 ? (
            <ul style={styles.list}>
              {athletes.map((athlete) => (
                <li key={athlete.id} style={styles.item}>
                  <strong>{athlete.id}</strong>
                  <div>{athlete.province || 'No location'}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.empty}>No athletes found.</p>
          )}
        </div>

        <div style={styles.card}>
          <h2 style={styles.section}>Coaches</h2>
          {coaches.length > 0 ? (
            <ul style={styles.list}>
              {coaches.map((coach) => (
                <li key={coach.id} style={styles.item}>
                  <strong>{coach.first_name || 'Coach'} {coach.last_name || ''}</strong>
                  <div>{coach.email}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={styles.empty}>No coaches found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 32,
    minHeight: '100vh',
    background: theme.colors.background,
  },
  title: {
    ...theme.typography.heading,
    marginBottom: 24,
  },
  filters: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr auto',
    gap: 12,
    marginBottom: 28,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    border: '1px solid #d1d5db',
  },
  select: {
    padding: 12,
    borderRadius: 12,
    border: '1px solid #d1d5db',
  },
  button: {
    background: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    padding: '12px 18px',
    borderRadius: 12,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  card: {
    background: theme.colors.card,
    borderRadius: 18,
    padding: 20,
    minHeight: 320,
  },
  section: {
    marginBottom: 18,
    ...theme.typography.subheading,
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  item: {
    padding: '14px 12px',
    borderRadius: 12,
    background: theme.colors.inputBackground,
    marginBottom: 12,
  },
  empty: {
    color: theme.colors.textMuted,
  },
};
