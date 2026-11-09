'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { SCHOOL_ACHIEVEMENTS } from '../mock-data';

export default function SchoolAchievementsPage() {
  const [achievements, setAchievements] = useState(SCHOOL_ACHIEVEMENTS);
  const [category, setCategory] = useState<'All' | 'Performance' | 'Academic' | 'Sportsmanship'>('All');

  const visibleAchievements = useMemo(() => {
    return achievements.filter((item) => category === 'All' || item.category === category);
  }, [achievements, category]);

  const toggleFeatured = (id: string) => {
    setAchievements((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, featured: !item.featured }
          : item,
      ),
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.kicker}>School</p>
        <h1 style={styles.heading}>Achievements</h1>
        <p style={styles.description}>School-level achievements and highlights.</p>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label="Total" value={achievements.length} />
        <MetricCard label="Featured" value={achievements.filter((item) => item.featured).length} />
        <MetricCard label="Visible" value={visibleAchievements.length} />
      </div>

      <SurfaceCard style={styles.filterCard}>
        <select
          style={styles.input}
          value={category}
          onChange={(event) => setCategory(event.target.value as 'All' | 'Performance' | 'Academic' | 'Sportsmanship')}
        >
          <option value="All">All categories</option>
          <option value="Performance">Performance</option>
          <option value="Academic">Academic</option>
          <option value="Sportsmanship">Sportsmanship</option>
        </select>
      </SurfaceCard>

      <section style={styles.card}>
        {visibleAchievements.map((item) => (
          <div key={item.id} style={styles.row}>
            <div>
              <div style={styles.title}>{item.title}</div>
              <div style={styles.meta}>{item.team} • {new Date(item.date).toLocaleDateString()}</div>
            </div>
            <div style={styles.actions}>
              <StatusPill label={item.category} tone="default" />
              <StatusPill label={item.featured ? 'Featured' : 'Standard'} tone={item.featured ? 'success' : 'warning'} />
              <ActionButton
                label={item.featured ? 'Unfeature' : 'Feature'}
                tone="neutral"
                onClick={() => toggleFeatured(item.id)}
              />
            </div>
          </div>
        ))}
        {!visibleAchievements.length ? <div style={styles.placeholder}>No achievements to show for this category.</div> : null}
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', flexDirection: 'column', gap: 8 },
  kicker: { color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase' },
  heading: { margin: 0, fontSize: 28, color: theme.colors.textPrimary },
  description: { marginTop: 6, color: theme.colors.textMuted },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  filterCard: { padding: 14 },
  input: {
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    padding: '10px 12px',
    maxWidth: 260,
  },
  card: { background: theme.colors.card, padding: 18, borderRadius: 12, display: 'grid', gap: 10, border: `1px solid ${theme.colors.border}` },
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
  actions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  placeholder: { color: theme.colors.textMuted },
};
