'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { COACH_ACTIVITIES } from '../mock-data';

export default function CoachActivitiesPage() {
  const [activities, setActivities] = useState(COACH_ACTIVITIES);
  const [sportFilter, setSportFilter] = useState('All');
  const [reviewFilter, setReviewFilter] = useState<'All' | 'Reviewed' | 'Pending'>('All');

  const visibleActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSport = sportFilter === 'All' || activity.sport === sportFilter;
      const matchesReview =
        reviewFilter === 'All' ||
        (reviewFilter === 'Reviewed' ? activity.reviewed : !activity.reviewed);
      return matchesSport && matchesReview;
    });
  }, [activities, reviewFilter, sportFilter]);

  const reviewedCount = activities.filter((activity) => activity.reviewed).length;
  const pendingCount = activities.length - reviewedCount;

  const sports = useMemo(() => {
    return ['All', ...Array.from(new Set(activities.map((activity) => activity.sport)))];
  }, [activities]);

  const markReviewed = (id: string) => {
    setActivities((current) =>
      current.map((item) => (item.id === id ? { ...item, reviewed: true } : item)),
    );
  };

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>Coach Pages</p>
      <h1 style={styles.heading}>Activities</h1>
      <p style={styles.text}>Review and monitor athlete activities and session participation in one place.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Total activity logs" value={activities.length} />
        <MetricCard label="Reviewed" value={reviewedCount} />
        <MetricCard label="Pending review" value={pendingCount} />
      </div>

      <SurfaceCard style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          <select
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
            style={styles.select}
          >
            {sports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <select
            value={reviewFilter}
            onChange={(event) => setReviewFilter(event.target.value as 'All' | 'Reviewed' | 'Pending')}
            style={styles.select}
          >
            <option value="All">All reviews</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <h2 style={styles.cardHeading}>Athlete Activity Feed</h2>
        <div style={styles.activityList}>
          {visibleActivities.map((activity) => (
            <div key={activity.id} style={styles.activityRow}>
              <div>
                <div style={styles.activityTitle}>{activity.activity}</div>
                <div style={styles.activityMeta}>
                  {activity.athlete} • {activity.sport} • {new Date(activity.date).toLocaleDateString()}
                </div>
              </div>
              <div style={styles.activityActions}>
                <StatusPill
                  label={activity.intensity}
                  tone={activity.intensity === 'High' ? 'warning' : activity.intensity === 'Moderate' ? 'default' : 'success'}
                />
                <StatusPill label={activity.reviewed ? 'Reviewed' : 'Pending'} tone={activity.reviewed ? 'success' : 'error'} />
                {!activity.reviewed ? (
                  <ActionButton label="Mark Reviewed" tone="neutral" onClick={() => markReviewed(activity.id)} />
                ) : null}
              </div>
            </div>
          ))}
          {!visibleActivities.length ? <p style={styles.emptyText}>No activities match the current filters.</p> : null}
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
  filtersCard: {
    padding: 16,
  },
  filtersRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  select: {
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    padding: '10px 12px',
    color: theme.colors.textPrimary,
  },
  listCard: {
    padding: 18,
  },
  cardHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  activityList: {
    display: 'grid',
    gap: 10,
  },
  activityRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    background: theme.colors.background,
    flexWrap: 'wrap',
  },
  activityTitle: {
    color: theme.colors.textPrimary,
    fontWeight: 700,
  },
  activityMeta: {
    color: theme.colors.textMuted,
    marginTop: 4,
    fontSize: 13,
  },
  activityActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  emptyText: {
    margin: 0,
    color: theme.colors.textMuted,
  },
};
