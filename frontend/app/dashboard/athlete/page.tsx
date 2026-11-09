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

const ATHLETE_SHELL_FALLBACK = {
  activityCount: 3,
  sportCount: 2,
};

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [activityCount, setActivityCount] = useState(ATHLETE_SHELL_FALLBACK.activityCount);
  const [sportCount, setSportCount] = useState(ATHLETE_SHELL_FALLBACK.sportCount);

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
      userData = { id: '', first_name: 'Athlete', role: 'ATHLETE' };
    }

    setUser(userData);
    if (userData.id) {
      loadAthlete(userData.id);
    }
    loadAnalytics();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const loadAthlete = async (userId: string) => {
    try {
      const resAthlete = await fetchWithAuth(`/athletes/user/${userId}`);
      if (!resAthlete?.ok) {
        setAthlete(null);
        setSportCount(ATHLETE_SHELL_FALLBACK.sportCount);
        return;
      }

      const athleteText = await resAthlete.text();
      if (!athleteText) return;

      const athleteData = JSON.parse(athleteText);
      if (!athleteData || !athleteData.id) {
        setAthlete(null);
        setSportCount(ATHLETE_SHELL_FALLBACK.sportCount);
        return;
      }

      const resSports = await fetchWithAuth(`/athlete-sports/${athleteData.id}`);
      const sports = resSports?.ok ? await resSports.json() : [];
      const sportsArray = Array.isArray(sports) ? sports : sports.data || [];
      const computedSports = new Set(sportsArray.map((item: any) => item.sport_id)).size;
      setSportCount(computedSports || ATHLETE_SHELL_FALLBACK.sportCount);

      setAthlete({
        ...athleteData,
        sports: sportsArray,
      });
    } catch (err) {
      console.error('Athlete load error:', err);
      setAthlete(null);
      setSportCount(ATHLETE_SHELL_FALLBACK.sportCount);
    }
  };

  const loadAnalytics = async () => {
    try {
      const resActivities = await fetchWithAuth('/activities');
      if (!resActivities?.ok) {
        setActivityCount(ATHLETE_SHELL_FALLBACK.activityCount);
        return;
      }
      const data = await resActivities.json();
      const computedActivities = Array.isArray(data) ? data.length : data.data?.length ?? 0;
      setActivityCount(computedActivities || ATHLETE_SHELL_FALLBACK.activityCount);
    } catch (err) {
      console.error('Analytics load error:', err);
      setActivityCount(ATHLETE_SHELL_FALLBACK.activityCount);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.kicker}>Welcome back</p>
          <h1 style={styles.heading}>{user ? `Hello, ${user.first_name || 'Athlete'}` : 'Welcome to PlayVerified'}</h1>
          <p style={styles.subtitle}>
            Your athlete dashboard is ready. Manage profile data, upcoming activity, and progress from one place.
          </p>
        </div>

        <ActionButton label="Logout" onClick={handleLogout} />
      </div>

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <p style={styles.heroLabel}>Athlete Dashboard</p>
          <h2 style={styles.heroTitle}>My Dashboard</h2>
          <p style={styles.heroText}>
            Track your training performance, manage sports, and stay connected with your athletic network.
          </p>
          <div style={styles.heroChips}>
            <StatusPill label={`Role: ${user?.role ?? 'Athlete'}`} />
            <StatusPill label={`Sports: ${sportCount}`} />
            <StatusPill label={`Activities: ${activityCount}`} />
          </div>
        </div>

        <div style={styles.heroImageWrapper}>
          <img src="/creative-tim/bg-profile.jpeg" alt="Dashboard" style={styles.heroImage} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <MetricCard label="Connected people" value="12" note="Keep building your network." />
        <MetricCard label="Achievements" value="8" note="Recent milestones unlocked." />
        <MetricCard label="Profile completion" value="86%" note="Update your details to increase visibility." />
      </div>

      <div style={styles.cardsGrid}>
        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardHeading}>Quick actions</h3>
          <ActionLinkList
            items={[
              { href: '/dashboard/profile', label: 'My Profile' },
              { href: '/dashboard/athlete/activities', label: 'Activities' },
              { href: '/dashboard/athlete/connections', label: 'Connections' },
              { href: '/dashboard/athlete/achievements', label: 'Achievements' },
              { href: '/dashboard/athlete/sports', label: 'Sports' },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardHeading}>Latest summary</h3>
          <p style={styles.text}>
            Your current athlete details are being synced with PlayVerified. Use the sidebar to navigate between profile and performance pages.
          </p>
          <DetailList
            labelColumnWidth="1fr auto"
            items={[
              { label: 'Active sports', value: sportCount },
              { label: 'Recorded sessions', value: activityCount },
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
  chip: {
    padding: '10px 16px',
    borderRadius: theme.spacing.borderRadiusPill,
    background: theme.colors.infoSoft,
    color: theme.colors.primary,
    fontWeight: 700,
    fontSize: 13,
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
  statCard: {
    background: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    padding: 24,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.soft,
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: theme.colors.textPrimary,
  },
  statNote: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontSize: 14,
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
  linkGrid: {
    display: 'grid',
    gap: 12,
  },
  quickLink: {
    display: 'inline-block',
    padding: '12px 18px',
    borderRadius: 14,
    background: theme.colors.infoSoft,
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: 700,
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
