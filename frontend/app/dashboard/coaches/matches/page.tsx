'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { COACH_MATCHES } from '../mock-data';

export default function CoachMatchesPage() {
  const [matches, setMatches] = useState(COACH_MATCHES);
  const [view, setView] = useState<'All' | 'Scheduled' | 'Completed'>('All');

  const visibleMatches = useMemo(() => {
    return matches.filter((match) => view === 'All' || match.status === view);
  }, [matches, view]);

  const scheduledCount = matches.filter((match) => match.status === 'Scheduled').length;
  const completedCount = matches.filter((match) => match.status === 'Completed').length;
  const winCount = matches.filter((match) => match.result === 'Win').length;

  const recordResult = (id: string, result: 'Win' | 'Loss' | 'Draw') => {
    setMatches((current) =>
      current.map((match) =>
        match.id === id
          ? { ...match, status: 'Completed', result }
          : match,
      ),
    );
  };

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>Coach Pages</p>
      <h1 style={styles.heading}>Matches</h1>
      <p style={styles.text}>Track fixtures, outcomes, and preparation status for upcoming and completed matches.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Scheduled" value={scheduledCount} />
        <MetricCard label="Completed" value={completedCount} />
        <MetricCard label="Wins" value={winCount} note="From completed matches." />
      </div>

      <SurfaceCard style={styles.toggleCard}>
        <div style={styles.toggleRow}>
          <ActionButton label="All" tone={view === 'All' ? 'primary' : 'neutral'} onClick={() => setView('All')} />
          <ActionButton label="Scheduled" tone={view === 'Scheduled' ? 'primary' : 'neutral'} onClick={() => setView('Scheduled')} />
          <ActionButton label="Completed" tone={view === 'Completed' ? 'primary' : 'neutral'} onClick={() => setView('Completed')} />
        </div>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <h2 style={styles.cardHeading}>Fixture Board</h2>
        <div style={styles.matchList}>
          {visibleMatches.map((match) => (
            <div key={match.id} style={styles.matchRow}>
              <div>
                <div style={styles.matchTitle}>{match.team} vs {match.opponent}</div>
                <div style={styles.matchMeta}>
                  {new Date(match.date).toLocaleString()} • {match.location}
                </div>
              </div>
              <div style={styles.matchActions}>
                <StatusPill label={match.status} tone={match.status === 'Completed' ? 'success' : 'warning'} />
                {match.result ? <StatusPill label={match.result} tone={match.result === 'Win' ? 'success' : match.result === 'Loss' ? 'error' : 'default'} /> : null}
                {match.status === 'Scheduled' ? (
                  <>
                    <ActionButton label="Win" tone="neutral" onClick={() => recordResult(match.id, 'Win')} />
                    <ActionButton label="Loss" tone="neutral" onClick={() => recordResult(match.id, 'Loss')} />
                    <ActionButton label="Draw" tone="neutral" onClick={() => recordResult(match.id, 'Draw')} />
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {!visibleMatches.length ? <p style={styles.emptyText}>No matches in this view.</p> : null}
        </div>
      </SurfaceCard>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 18 },
  kicker: { margin: 0, color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  heading: { margin: 0, color: theme.colors.textPrimary, fontSize: 32 },
  text: { margin: 0, color: theme.colors.textMuted, lineHeight: 1.7 },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  toggleCard: {
    padding: 16,
  },
  toggleRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  listCard: {
    padding: 18,
  },
  cardHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  matchList: {
    display: 'grid',
    gap: 10,
  },
  matchRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 12,
    background: theme.colors.background,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  matchTitle: {
    color: theme.colors.textPrimary,
    fontWeight: 700,
  },
  matchMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  matchActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  emptyText: {
    margin: 0,
    color: theme.colors.textMuted,
  },
};
