'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { COACH_ACHIEVEMENTS } from '../mock-data';

export default function CoachAchievementsPage() {
  const [achievements, setAchievements] = useState(COACH_ACHIEVEMENTS);
  const [category, setCategory] = useState<'All' | 'Performance' | 'Leadership' | 'Attendance'>('All');

  const visibleAchievements = useMemo(() => {
    return achievements.filter((item) => category === 'All' || item.category === category);
  }, [achievements, category]);

  const highlightedCount = achievements.filter((item) => item.highlighted).length;

  const toggleHighlight = (id: string) => {
    setAchievements((current) =>
      current.map((item) =>
        item.id === id ? { ...item, highlighted: !item.highlighted } : item,
      ),
    );
  };

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>Coach Pages</p>
      <h1 style={styles.heading}>Achievements</h1>
      <p style={styles.text}>Review key achievements and milestone progress across your coached squads.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Total achievements" value={achievements.length} />
        <MetricCard label="Highlighted" value={highlightedCount} />
        <MetricCard label="Visible now" value={visibleAchievements.length} />
      </div>

      <SurfaceCard style={styles.filterCard}>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as 'All' | 'Performance' | 'Leadership' | 'Attendance')}
          style={styles.select}
        >
          <option value="All">All categories</option>
          <option value="Performance">Performance</option>
          <option value="Leadership">Leadership</option>
          <option value="Attendance">Attendance</option>
        </select>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <h2 style={styles.cardHeading}>Achievement Board</h2>
        <div style={styles.achievementList}>
          {visibleAchievements.map((item) => (
            <div key={item.id} style={styles.achievementRow}>
              <div>
                <div style={styles.itemTitle}>{item.title}</div>
                <div style={styles.itemMeta}>
                  {item.team} • {item.athlete} • {new Date(item.date).toLocaleDateString()}
                </div>
              </div>
              <div style={styles.achievementActions}>
                <StatusPill label={item.category} tone="default" />
                <StatusPill label={item.highlighted ? 'Highlighted' : 'Standard'} tone={item.highlighted ? 'success' : 'warning'} />
                <ActionButton
                  label={item.highlighted ? 'Unhighlight' : 'Highlight'}
                  tone="neutral"
                  onClick={() => toggleHighlight(item.id)}
                />
              </div>
            </div>
          ))}
          {!visibleAchievements.length ? <p style={styles.emptyText}>No achievements in this category.</p> : null}
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
  filterCard: {
    padding: 16,
  },
  select: {
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    padding: '10px 12px',
    color: theme.colors.textPrimary,
    minWidth: 220,
  },
  listCard: {
    padding: 18,
  },
  cardHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  achievementList: {
    display: 'grid',
    gap: 10,
  },
  achievementRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 12,
    background: theme.colors.background,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  itemTitle: {
    color: theme.colors.textPrimary,
    fontWeight: 700,
  },
  itemMeta: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontSize: 13,
  },
  achievementActions: {
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
