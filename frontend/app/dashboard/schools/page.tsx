'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../styles/theme';
import { fetchWithAuth } from '../../lib/api';
import {
  ActionButton,
  ActionLinkList,
  DetailList,
  MetricCard,
  StatusPill,
  SurfaceCard,
} from '../components/primitives';

const SCHOOL_SHELL_FALLBACK = {
  activityCount: 3,
};

export default function SchoolDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [coachCount] = useState(24);
  const [teamCount] = useState(8);
  const [fixturesCount] = useState(14);
  const [logCount] = useState(6);
  const [activityCount, setActivityCount] = useState(SCHOOL_SHELL_FALLBACK.activityCount);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    let userData: any;
    try {
      userData = JSON.parse(storedUser);
    } catch {
      userData = { first_name: 'School Admin', role: 'SCHOOL' };
    }

    setUser(userData);
    loadAnalytics();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const loadAnalytics = async () => {
    try {
      const resActivities = await fetchWithAuth('/activities');
      if (!resActivities?.ok) {
        setActivityCount(SCHOOL_SHELL_FALLBACK.activityCount);
        return;
      }
      const data = await resActivities.json();
      const computedActivities = Array.isArray(data) ? data.length : data.data?.length ?? 0;
      setActivityCount(computedActivities || SCHOOL_SHELL_FALLBACK.activityCount);
    } catch (err) {
      console.error('School analytics load error:', err);
      setActivityCount(SCHOOL_SHELL_FALLBACK.activityCount);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.kicker}>Welcome back</p>
          <h1 style={styles.heading}>{user ? `Hello, ${user.first_name || 'School Admin'}` : 'Welcome to PlayVerified'}</h1>
          <p style={styles.subtitle}>
            Your school dashboard is ready. Manage coaches, teams, fixtures, and logs from one place.
          </p>
        </div>

        <ActionButton label="Logout" onClick={handleLogout} />
      </div>

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <p style={styles.heroLabel}>School Dashboard</p>
          <h2 style={styles.heroTitle}>My Dashboard</h2>
          <p style={styles.heroText}>
            Coordinate your school sports program, track fixtures, and monitor operational activity across the platform.
          </p>
          <div style={styles.heroChips}>
            <StatusPill label={`Role: ${user?.role ?? 'SCHOOL'}`} />
            <StatusPill label={`Teams: ${teamCount}`} />
            <StatusPill label={`Fixtures: ${fixturesCount}`} />
          </div>
        </div>

        <div style={styles.heroImageWrapper}>
          <img src="/creative-tim/bg-profile.jpeg" alt="School dashboard" style={styles.heroImage} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <MetricCard label="Coaches" value={coachCount} note="Active across the school." />
        <MetricCard label="Logs" value={logCount} note="Recent operational entries." />
        <MetricCard label="Activities" value={activityCount} note="Platform activity records available." />
      </div>

      <div style={styles.cardsGrid}>
        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardHeading}>Quick actions</h3>
          <ActionLinkList
            items={[
              { href: '/dashboard/profile', label: 'My Profile' },
              { href: '/dashboard/schools/coaches', label: 'Coaches' },
              { href: '/dashboard/schools/teams', label: 'Teams' },
              { href: '/dashboard/schools/fixtures', label: 'Fixtures' },
              { href: '/dashboard/schools/logs', label: 'Logs' },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardHeading}>Latest summary</h3>
          <p style={styles.text}>
            Use the left navigation to move between coaches, team oversight, fixtures, logs, and achievements.
          </p>
          <DetailList
            labelColumnWidth="1fr auto"
            items={[
              { label: 'Scheduled fixtures', value: fixturesCount },
              { label: 'Recent log entries', value: logCount },
            ]}
          />
        </SurfaceCard>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 20,
    flexWrap: 'wrap',
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heading: {
    margin: 0,
    fontSize: 34,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    marginTop: 14,
    maxWidth: 680,
    color: theme.colors.textMuted,
    lineHeight: 1.7,
  },
  logoutBtn: {
    padding: '12px 22px',
    borderRadius: theme.spacing.borderRadius,
    border: 'none',
    background: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
    background: theme.colors.card,
    borderRadius: theme.spacing.borderRadiusLg,
    padding: 28,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.medium,
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 18,
  },
  heroLabel: {
    margin: 0,
    color: theme.colors.primary,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.10em',
    fontSize: 13,
  },
  heroTitle: {
    margin: 0,
    fontSize: 34,
    color: theme.colors.textPrimary,
  },
  heroText: {
    maxWidth: 620,
    color: theme.colors.textMuted,
    lineHeight: 1.75,
  },
  heroChips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroImageWrapper: {
    borderRadius: theme.spacing.borderRadiusLg,
    overflow: 'hidden',
    minHeight: 260,
    boxShadow: theme.shadows.medium,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 20,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  card: {
    background: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    padding: 24,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.soft,
  },
  cardHeading: {
    margin: 0,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: 700,
  },
  text: {
    color: theme.colors.textMuted,
    lineHeight: 1.75,
    marginBottom: 22,
  },
  listRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  listItem: {
    padding: 18,
    borderRadius: 18,
    background: theme.colors.surfaceMuted,
    border: `1px solid ${theme.colors.border}`,
  },
  listNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
};
