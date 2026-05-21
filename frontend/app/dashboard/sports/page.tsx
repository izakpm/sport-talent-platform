'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../../styles/theme';
import { fetchWithAuth } from '../../lib/api';

export default function DashboardSportsPage() {
  const [athlete, setAthlete] = useState<any>(null);
  const [sportsMap, setSportsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const parsed = JSON.parse(stored);
      loadAthlete(parsed.id);
      loadSportNames();
    }
  }, []);

  const loadAthlete = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/athletes/user/${userId}`);
      if (!res?.ok) return;
      const athleteText = await res.text();
      const athleteJson = JSON.parse(athleteText);
      const resSports = await fetchWithAuth(`/athlete-sports/${athleteJson.id}`);
      const sports = resSports?.ok ? await resSports.json() : [];
      setAthlete({ ...athleteJson, sports: Array.isArray(sports) ? sports : sports.data || [] });
    } catch {
      setAthlete(null);
    }
  };

  const loadSportNames = async () => {
    try {
      const res = await fetchWithAuth('/sports');
      if (!res?.ok) return;
      const data = await res.json();
      const map: Record<string, string> = {};
      (Array.isArray(data) ? data : data.data || []).forEach((sport: any) => {
        map[sport.id] = sport.name;
      });
      setSportsMap(map);
    } catch {
      setSportsMap({});
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Sport Summary</p>
          <h1 style={styles.heading}>Sports & Positions</h1>
          <p style={styles.description}>Review the sports you are registered with and the positions you play.</p>
        </div>
      </div>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Current Sports</h2>
        {athlete?.sports?.length ? (
          <div style={styles.grid}>
            {athlete.sports.map((item: any) => (
              <div key={item.id} style={styles.sportCard}>
                <div style={styles.sportName}>{sportsMap[item.sport_id] || 'Sport'}</div>
                <div style={styles.sportTag}>{item.is_primary ? 'Primary' : 'Secondary'}</div>
                <div style={styles.positionText}>{item.position_id ? `Position: ${item.position_id}` : 'Position not set'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={styles.placeholder}>No sports details available yet.</p>
        )}
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  kicker: {
    color: theme.colors.primary,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  heading: {
    margin: 0,
    fontSize: 32,
    color: theme.colors.textPrimary,
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textMuted,
    maxWidth: 620,
  },
  card: {
    background: theme.colors.card,
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
  },
  cardTitle: {
    margin: 0,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: 700,
  },
  grid: {
    display: 'grid',
    gap: 16,
  },
  sportCard: {
    padding: 20,
    borderRadius: 20,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  sportName: {
    fontSize: 17,
    fontWeight: 700,
    marginBottom: 8,
  },
  sportTag: {
    display: 'inline-block',
    background: theme.colors.primary,
    color: theme.colors.white,
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
  },
  positionText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  placeholder: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
};
