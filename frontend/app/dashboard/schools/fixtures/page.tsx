'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { SCHOOL_FIXTURES } from '../mock-data';

export default function SchoolFixturesPage() {
  const [fixtures, setFixtures] = useState(SCHOOL_FIXTURES);
  const [view, setView] = useState<'All' | 'Scheduled' | 'Confirmed' | 'Completed'>('All');

  const visibleFixtures = useMemo(() => {
    return fixtures.filter((fixture) => view === 'All' || fixture.status === view);
  }, [fixtures, view]);

  const confirmFixture = (id: string) => {
    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === id && fixture.status === 'Scheduled'
          ? { ...fixture, status: 'Confirmed' }
          : fixture,
      ),
    );
  };

  const recordResult = (id: string, result: 'Win' | 'Loss' | 'Draw') => {
    setFixtures((current) =>
      current.map((fixture) =>
        fixture.id === id
          ? { ...fixture, status: 'Completed', result }
          : fixture,
      ),
    );
  };

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>School Pages</p>
      <h1 style={styles.heading}>Fixtures</h1>
      <p style={styles.text}>Track upcoming fixtures, venues, and schedule readiness across your school sports program.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Scheduled" value={fixtures.filter((f) => f.status === 'Scheduled').length} />
        <MetricCard label="Confirmed" value={fixtures.filter((f) => f.status === 'Confirmed').length} />
        <MetricCard label="Completed" value={fixtures.filter((f) => f.status === 'Completed').length} />
      </div>

      <SurfaceCard style={styles.viewCard}>
        <div style={styles.viewRow}>
          <ActionButton label="All" tone={view === 'All' ? 'primary' : 'neutral'} onClick={() => setView('All')} />
          <ActionButton label="Scheduled" tone={view === 'Scheduled' ? 'primary' : 'neutral'} onClick={() => setView('Scheduled')} />
          <ActionButton label="Confirmed" tone={view === 'Confirmed' ? 'primary' : 'neutral'} onClick={() => setView('Confirmed')} />
          <ActionButton label="Completed" tone={view === 'Completed' ? 'primary' : 'neutral'} onClick={() => setView('Completed')} />
        </div>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <h2 style={styles.subHeading}>Fixture List</h2>
        <div style={styles.list}>
          {visibleFixtures.map((fixture) => (
            <div key={fixture.id} style={styles.row}>
              <div>
                <div style={styles.title}>{fixture.team} vs {fixture.opponent}</div>
                <div style={styles.meta}>{new Date(fixture.date).toLocaleString()} • {fixture.venue}</div>
              </div>
              <div style={styles.actions}>
                <StatusPill
                  label={fixture.status}
                  tone={fixture.status === 'Completed' ? 'success' : fixture.status === 'Confirmed' ? 'default' : 'warning'}
                />
                {fixture.result ? (
                  <StatusPill label={fixture.result} tone={fixture.result === 'Win' ? 'success' : fixture.result === 'Loss' ? 'error' : 'default'} />
                ) : null}
                {fixture.status === 'Scheduled' ? (
                  <ActionButton label="Confirm" tone="neutral" onClick={() => confirmFixture(fixture.id)} />
                ) : null}
                {(fixture.status === 'Scheduled' || fixture.status === 'Confirmed') ? (
                  <>
                    <ActionButton label="Win" tone="neutral" onClick={() => recordResult(fixture.id, 'Win')} />
                    <ActionButton label="Loss" tone="neutral" onClick={() => recordResult(fixture.id, 'Loss')} />
                    <ActionButton label="Draw" tone="neutral" onClick={() => recordResult(fixture.id, 'Draw')} />
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {!visibleFixtures.length ? <p style={styles.empty}>No fixtures in this view.</p> : null}
        </div>
      </SurfaceCard>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 16 },
  kicker: { margin: 0, color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  heading: { margin: 0, color: theme.colors.textPrimary, fontSize: 32 },
  text: { margin: 0, color: theme.colors.textMuted, lineHeight: 1.7 },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  viewCard: { padding: 14 },
  viewRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  listCard: { padding: 18 },
  subHeading: { margin: '0 0 12px', color: theme.colors.textPrimary, fontSize: 18 },
  list: { display: 'grid', gap: 10 },
  row: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
    background: theme.colors.background,
  },
  title: { color: theme.colors.textPrimary, fontWeight: 700 },
  meta: { marginTop: 4, color: theme.colors.textMuted, fontSize: 13 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  empty: { margin: 0, color: theme.colors.textMuted },
};
