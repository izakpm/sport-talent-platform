'use client';

import { useEffect, useState } from 'react';
import { theme } from '../styles/theme';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [athlete, setAthlete] = useState<any>(null);

  const [sportsMap, setSportsMap] = useState<any>({});
  const [positionsMap, setPositionsMap] = useState<any>({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const userData = JSON.parse(storedUser);

    loadUser(userData);
    loadLookupData();
    loadAthlete(userData.id);
  }, []);

  const loadUser = async (localUser: any) => {
    try {
      const res = await fetch(`http://localhost:3000/users/${localUser.id}`);
      const data = await res.json();
      setUser(data || localUser);
    } catch {
      setUser(localUser);
    }
  };

  const loadLookupData = async () => {
    const sports = await fetch('http://localhost:3000/sports').then(r => r.json());
    const positions = await fetch('http://localhost:3000/positions').then(r => r.json());

    const sm: any = {};
    sports.forEach((s: any) => (sm[s.id] = s.name));

    const pm: any = {};
    positions.forEach((p: any) => (pm[p.id] = p.name));

    setSportsMap(sm);
    setPositionsMap(pm);
  };

  const loadAthlete = async (user_id: string) => {
    const athlete = await fetch(`http://localhost:3000/athletes/user/${user_id}`).then(r => r.json());
    const sports = await fetch(`http://localhost:3000/athlete-sports/${athlete.id}`).then(r => r.json());

    setAthlete({
      ...athlete,
      sports: Array.isArray(sports) ? sports : [],
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.overlay}></div>

      <div style={styles.content}>

        {/* ✅ TOP BAR */}
        <div style={styles.topBar}>
          <h2 style={styles.logo}>VeriPlay</h2>
          <span style={styles.nav}>Dashboard</span>
        </div>

        {/* ✅ HERO */}
        <div style={styles.heroCard}>
          <div>
            <h1 style={styles.name}>
              {user
                ? `${user.first_name || 'First'} ${user.last_name || 'Last'}`
                : 'Loading...'}
            </h1>

            <p style={styles.role}>
              {user?.role} • Athlete Profile
            </p>
          </div>

          <div style={styles.badge}>Pending Approval</div>
        </div>

        {/* ✅ MAIN GRID */}
        <div style={styles.grid}>

          {/* ✅ NEXT STEPS */}
          <div style={styles.card}>
            <h3 style={styles.section}>Next Steps</h3>

            <ul style={styles.text}>
              <li>✅ Complete Profile</li>
              <li>📊 Add Stats</li>
              <li>🎥 Upload Videos</li>
              <li>🤝 Connect Coaches</li>
            </ul>
          </div>

          {/* ✅ SPORT PROFILE */}
          <div style={styles.card}>
            <h3 style={styles.section}>Sport Profile</h3>

            {athlete?.sports?.length > 0 ? (
              Object.values(
                athlete.sports.reduce((acc: any, item: any) => {
                  if (!acc[item.sport_id]) {
                    acc[item.sport_id] = { sport_id: item.sport_id, positions: [] };
                  }
                  acc[item.sport_id].positions.push(item);
                  return acc;
                }, {})
              ).map((group: any) => (
                <div key={group.sport_id}>
                  <h4 style={styles.subheading}>
                    {sportsMap[group.sport_id]}
                  </h4>

                  <div style={styles.positions}>
                    {group.positions.map((p: any) => (
                      <div
                        key={p.id}
                        style={{
                          ...styles.tag,
                          background: p.is_primary
                            ? theme.colors.accentDark
                            : theme.colors.accent,
                        }}
                      >
                        {positionsMap[p.position_id]}
                        {p.is_primary && ' • Primary'}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.text}>No data</p>
            )}
          </div>

        </div>

        {/* ✅ NEW: SECOND GRID */}
        <div style={styles.grid}>

          {/* ✅ ACTIVITIES */}
          <div style={styles.card}>
            <h3 style={styles.section}>Recent Activities</h3>

            <ul style={styles.text}>
              <li>✅ Completed profile</li>
              <li>🎥 Uploaded highlight video</li>
              <li>📊 Added performance stats</li>
              <li>🤝 Connected with coach</li>
            </ul>
          </div>

          {/* ✅ MEDIA */}
          <div style={styles.card}>
            <h3 style={styles.section}>Media</h3>

            <div style={styles.mediaGrid}>
              <div style={styles.mediaItem}></div>
              <div style={styles.mediaItem}></div>
              <div style={styles.mediaItem}></div>
              <div style={styles.mediaItem}></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

/* ✅ STYLES */

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: "url('/register-bg.jpg')",
    backgroundSize: 'cover',
    position: 'relative',
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: theme.colors.overlay,
  },

  content: {
    position: 'relative',
    zIndex: 1,
    padding: 30,
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    color: theme.colors.white,
    marginBottom: 20,
  },

  logo: {
    color: theme.colors.white,
  },

  nav: {
    color: theme.colors.white,
  },

  heroCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: theme.colors.card,
    padding: 30,
    borderRadius: 18,
    marginBottom: 20,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
  },

  name: {
    ...theme.typography.heading,
    fontSize: 30,
  },

  role: {
    ...theme.typography.muted,
  },

  badge: {
    background: theme.colors.warning,
    color: theme.colors.white,
    padding: '8px 16px',
    borderRadius: 20,
    fontWeight: 'bold',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
    marginBottom: 20,
  },

  card: {
    background: theme.colors.card,
    padding: 25,
    borderRadius: 18,
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
  },

  section: {
    ...theme.typography.subheading,
    marginBottom: 15,
  },

  subheading: {
    ...theme.typography.subheading,
    marginBottom: 8,
  },

  text: {
    ...theme.typography.body,
  },

  positions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
    marginTop: 5,
  },

  tag: {
    color: '#fff',
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 'bold',
  },

  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },

  mediaItem: {
    height: 80,
    background: '#cbd5e1',
    borderRadius: 10,
  },
};