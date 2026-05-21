'use client';

import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../styles/theme';
import { fetchWithAuth } from '../lib/api';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);
  const [activityCount, setActivityCount] = useState(0);
  const [sportCount, setSportCount] = useState(0);

  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadAthlete(userData.id);
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
        return;
      }

      const athleteText = await resAthlete.text();
      if (!athleteText) return;

      const athleteData = JSON.parse(athleteText);
      if (!athleteData || !athleteData.id) {
        setAthlete(null);
        return;
      }

      const resSports = await fetchWithAuth(`/athlete-sports/${athleteData.id}`);
      const sports = resSports?.ok ? await resSports.json() : [];
      const sportsArray = Array.isArray(sports) ? sports : sports.data || [];
      setSportCount(new Set(sportsArray.map((item: any) => item.sport_id)).size);

      setAthlete({
        ...athleteData,
        sports: sportsArray,
      });
    } catch (err) {
      console.error('Athlete load error:', err);
      setAthlete(null);
    }
  };

  const loadAnalytics = async () => {
    try {
      const resActivities = await fetchWithAuth('/activities');
      if (!resActivities?.ok) return;
      const data = await resActivities.json();
      setActivityCount(Array.isArray(data) ? data.length : data.data?.length ?? 0);
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <p style={styles.kicker}>Welcome back</p>
          <h1 style={styles.heading}>{user ? `Hello, ${user.first_name || 'Athlete'}` : 'Welcome to VeriPlay'}</h1>
          <p style={styles.subtitle}>
            Your athlete dashboard is ready. Manage profile data, upcoming activity, and progress from one place.
          </p>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>

      <div style={styles.heroSection}>
        <div style={styles.heroContent}>
          <p style={styles.heroLabel}>Athlete Dashboard</p>
          <h2 style={styles.heroTitle}>My Dashboard</h2>
          <p style={styles.heroText}>
            Track your training performance, manage sports, and stay connected with your athletic network.
          </p>
          <div style={styles.heroChips}>
            <span style={styles.chip}>Role: {user?.role ?? 'Athlete'}</span>
            <span style={styles.chip}>Sports: {sportCount}</span>
            <span style={styles.chip}>Activities: {activityCount}</span>
          </div>
        </div>

        <div style={styles.heroImageWrapper}>
          <img src="/creative-tim/bg-profile.jpeg" alt="Dashboard" style={styles.heroImage} />
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Connected people</div>
          <div style={styles.statValue}>12</div>
          <div style={styles.statNote}>Keep building your network.</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Achievements</div>
          <div style={styles.statValue}>8</div>
          <div style={styles.statNote}>Recent milestones unlocked.</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Profile completion</div>
          <div style={styles.statValue}>86%</div>
          <div style={styles.statNote}>Update your details to increase visibility.</div>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardHeading}>Quick actions</h3>
          <div style={styles.linkGrid}>
            <Link href="/dashboard/profile" style={styles.quickLink}>My Profile</Link>
            <Link href="/dashboard/activities" style={styles.quickLink}>Activities</Link>
            <Link href="/dashboard/connections" style={styles.quickLink}>Connections</Link>
            <Link href="/dashboard/achievements" style={styles.quickLink}>Achievements</Link>
            <Link href="/dashboard/sports" style={styles.quickLink}>Sports</Link>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardHeading}>Latest summary</h3>
          <p style={styles.text}>
            Your current athlete details are being synced with VeriPlay. Use the sidebar to navigate between profile and performance pages.
          </p>
          <div style={styles.listRow}>
            <div style={styles.listItem}>
              <div style={styles.listNumber}>{sportCount}</div>
              <div>Active sports</div>
            </div>
            <div style={styles.listItem}>
              <div style={styles.listNumber}>{activityCount}</div>
              <div>Recorded sessions</div>
            </div>
          </div>
        </div>
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
    borderRadius: 15,
    border: 'none',
    background: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 700,
    cursor: 'pointer',
  },
  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
    gap: 24,
    background: theme.colors.card,
    borderRadius: 24,
    padding: 28,
    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)',
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
    borderRadius: 999,
    background: '#eef2ff',
    color: theme.colors.primary,
    fontWeight: 700,
    fontSize: 13,
  },
  heroImageWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 260,
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 20,
  },
  statCard: {
    background: theme.colors.card,
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
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
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: 20,
  },
  card: {
    background: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
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
    background: '#eef2ff',
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
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  listNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
};
