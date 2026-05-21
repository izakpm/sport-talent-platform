'use client';

import { type CSSProperties } from 'react';
import { theme } from '../../styles/theme';

const achievements = [
  { id: 1, title: 'Top Scorer', subtitle: 'Goal count increased 40% in last season' },
  { id: 2, title: 'Talent Scout Pick', subtitle: 'Featured in top athlete review' },
  { id: 3, title: 'Speed Milestone', subtitle: 'Improved sprint time by 0.8s' },
];

export default function DashboardAchievementsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Performance Awards</p>
          <h1 style={styles.heading}>Achievements</h1>
          <p style={styles.description}>Track your earned milestones and celebrate progress over time.</p>
        </div>
      </div>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Recent Achievements</h2>
        <div style={styles.list}>
          {achievements.map((achievement) => (
            <div key={achievement.id} style={styles.achievementItem}>
              <div>
                <div style={styles.achievementTitle}>{achievement.title}</div>
                <div style={styles.achievementSubtitle}>{achievement.subtitle}</div>
              </div>
              <span style={styles.achievementBadge}>Unlocked</span>
            </div>
          ))}
        </div>
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
  list: {
    display: 'grid',
    gap: 14,
  },
  achievementItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
    padding: 18,
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 700,
  },
  achievementSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  achievementBadge: {
    padding: '8px 14px',
    borderRadius: 999,
    background: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 700,
    fontSize: 13,
  },
};
