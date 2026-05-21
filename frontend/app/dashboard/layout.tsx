'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../styles/theme';

const navGroups = [
  {
    label: 'Athlete',
    items: [
      { name: 'My Profile', href: '/dashboard/profile' },
    ],
  },
  {
    label: 'Dashboards',
    items: [
      { name: 'My Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Pages',
    items: [
      { name: 'Activities', href: '/dashboard/activities' },
      { name: 'Connections', href: '/dashboard/connections' },
      { name: 'Achievements', href: '/dashboard/achievements' },
      { name: 'Sports', href: '/dashboard/sports' },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('Athlete');
  const [userRole, setUserRole] = useState('Athlete');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const stored = localStorage.getItem('user');
    if (!stored) return;

    try {
      const data = JSON.parse(stored);
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
      setUserName(fullName || 'Athlete');
      setUserRole(data.role || 'Athlete');
    } catch {
      setUserName('Athlete');
      setUserRole('Athlete');
    }
  }, [router]);

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandRow}>
          <img src="/creative-tim/logo-ct-dark.png" alt="VeriPlay" style={styles.brandLogo} />
          <div>
            <div style={styles.brandTitle}>VeriPlay Athlete</div>
            <div style={styles.brandText}>Training dashboard</div>
          </div>
        </div>

        <div style={styles.profileCard}>
          <div style={styles.profileAvatar}>{userName?.charAt(0) || 'A'}</div>
          <div>
            <div style={styles.profileName}>{userName}</div>
            <div style={styles.profileRole}>{userRole}</div>
          </div>
        </div>

        <div style={styles.navSection}>
          {navGroups.map((group) => (
            <div key={group.label} style={styles.navGroup}>
              <div style={styles.sectionLabel}>{group.label}</div>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      ...styles.navLink,
                      ...(active ? styles.navLinkActive : {}),
                    }}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: theme.colors.background,
  },
  sidebar: {
    width: 280,
    background: '#0b1f2e',
    color: theme.colors.white,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    objectFit: 'cover',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: theme.colors.white,
  },
  brandText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 20,
    background: '#12233a',
  },
  profileAvatar: {
    width: 48,
    height: 48,
    display: 'grid',
    placeItems: 'center',
    borderRadius: '50%',
    background: theme.colors.primary,
    color: theme.colors.white,
    fontWeight: 700,
    fontSize: 18,
  },
  profileName: {
    fontSize: 15,
    fontWeight: 700,
  },
  profileRole: {
    fontSize: 13,
    color: '#94a3b8',
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  navGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: '0.08em',
  },
  navLink: {
    display: 'block',
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '10px 14px',
    borderRadius: 14,
    transition: 'background 0.2s ease, color 0.2s ease',
  },
  navLinkActive: {
    color: theme.colors.white,
    background: '#1f6f8b',
  },
  main: {
    flex: 1,
    padding: 30,
    minHeight: '100vh',
    overflowX: 'hidden',
  },
};
