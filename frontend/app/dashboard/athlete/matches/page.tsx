'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../../styles/theme';
import { fetchWithAuth } from '../../../lib/api';

interface Match {
  id: string;
  date: string;
  opponent: string;
  location: string;
  position_played?: string;
  tries_scored?: number;
  result?: string;
  sport?: string;
  url?: string;
}

export default function DashboardMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    loadMatches();
  }, [router]);

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const userData = JSON.parse(storedUser);

      const athleteRes = await fetchWithAuth(`/athletes/user/${userData.id}`);
      if (!athleteRes?.ok) {
        setError('Failed to load athlete profile');
        return;
      }

      const athleteData = await athleteRes.json();
      if (!athleteData || !athleteData.id) {
        setError('No athlete profile found');
        return;
      }

      const placeholderMatches: Match[] = [
        {
          id: '1',
          date: '2026-05-24',
          opponent: 'South Africa U20',
          location: 'Johannesburg, SA',
          position_played: 'Fly-half',
          tries_scored: 2,
          result: 'W 28-24',
          sport: 'Rugby',
          url: 'https://live.supersportschools.com/events/6a0d8598812f6a842a680ea3/',
        },
        {
          id: '2',
          date: '2026-05-17',
          opponent: 'Australia U20',
          location: 'Melbourne, AU',
          position_played: 'Fly-half',
          tries_scored: 1,
          result: 'W 35-21',
          sport: 'Rugby',
          url: 'https://live.supersportschools.com/events/6a0d8598812f6a842a680ea3/',
        },
        {
          id: '3',
          date: '2026-05-10',
          opponent: 'New Zealand U20',
          location: 'Auckland, NZ',
          position_played: 'Fly-half',
          tries_scored: 0,
          result: 'L 19-31',
          sport: 'Rugby',
          url: 'https://live.supersportschools.com/events/6a0d8598812f6a842a680ea3/',
        },
      ];

      setMatches(placeholderMatches);
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('An error occurred while loading matches');
    } finally {
      setLoading(false);
    }
  };

  const updateUrl = (id: string, value: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.id === id ? { ...m, url: value } : m))
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerSection}>
        <p style={styles.kicker}>Match History</p>
        <h1 style={styles.heading}>Matches</h1>
        <p style={styles.subtitle}>
          View your recent match statistics and performance data.
        </p>
      </div>

      {loading && (
        <div style={styles.centerContent}>
          <p style={styles.loadingText}>Loading your matches...</p>
        </div>
      )}

      {error && !loading && (
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={loadMatches}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div style={styles.matchesList}>
          {matches.map((match) => (
            <div key={match.id} style={styles.matchCard}>

              {/* Header */}
              <div style={styles.matchHeader}>
                <div>
                  <h3 style={styles.opponent}>{match.opponent}</h3>
                  <p style={styles.date}>{formatDate(match.date)}</p>
                </div>

                <div style={styles.resultBadge(match.result?.startsWith('W'))}>
                  <span style={styles.resultText}>{match.result}</span>
                </div>
              </div>

              {/* Details */}
              <div style={styles.detailsGrid}>
                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Position</p>
                  <p style={styles.detailValue}>{match.position_played || '-'}</p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Tries</p>
                  <p style={styles.detailValue}>{match.tries_scored || 0}</p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Location</p>
                  <p style={styles.detailValue}>{match.location}</p>
                </div>

                <div style={styles.detailItem}>
                  <p style={styles.detailLabel}>Sport</p>
                  <p style={styles.detailValue}>{match.sport || '-'}</p>
                </div>
              </div>

              {/* ✅ URL FIELD */}
              <div style={styles.urlSection}>
                <p style={styles.detailLabel}>Match URL</p>

                <input
                  type="text"
                  placeholder="Paste YouTube / SuperSport link"
                  value={match.url || ''}
                  onChange={(e) => updateUrl(match.id, e.target.value)}
                  style={styles.urlInput}
                />

                {match.url && (
                  <a
                    href={match.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    Watch Match →
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>No matches found yet.</p>
          <p style={styles.emptySubText}>
            Your match history will appear here.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: CSSProperties | any } = {
  page: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    padding: '40px 24px',
  },

  headerSection: {
    marginBottom: '40px',
  },

  kicker: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },

  subtitle: {
    color: theme.colors.textMuted,
  },

  centerContent: {
    display: 'flex',
    justifyContent: 'center',
    padding: 60,
  },

  loadingText: {
    color: theme.colors.textMuted,
  },

  errorCard: {
    padding: 20,
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    textAlign: 'center',
  },

  errorText: {
    color: theme.colors.error,
  },

  retryBtn: {
    marginTop: 10,
    padding: '10px 16px',
    backgroundColor: theme.colors.error,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  matchesList: {
    width: '100%', // ✅ FULL WIDTH
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },

  matchCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    border: `1px solid ${theme.colors.border}`,
  },

  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  opponent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },

  date: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },

  resultBadge: (isWin?: boolean) => ({
    backgroundColor: isWin ? '#23f76d' : '#f74848',
    padding: '12px 22px',
    borderRadius: 15,
    border: 'none',
  }),

  resultText: {
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
  },

  detailItem: {
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 6,
  },

  detailLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },

  detailValue: {
    color: theme.colors.textMuted,
    fontWeight: 'bold',
  },

  urlSection: {
    marginTop: 20,
  },

  urlInput: {
    color: theme.colors.textMuted,
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    marginBottom: 8,
  },

  link: {
    color: theme.colors.primary,
    textDecoration: 'underline',
    fontSize: 14,
  },

  emptyCard: {
    textAlign: 'center',
    padding: 40,
  },

  emptyText: {
    fontWeight: 'bold',
  },

  emptySubText: {
    color: theme.colors.textMuted,
  },
};
