'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../styles/theme';
import { fetchWithAuth } from '../lib/api';
import {
  getDashboardRoleConfig,
  isDashboardPathAllowedForRole,
  normalizeDashboardRole,
  type DashboardRoleConfig,
} from './core/roles';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('User');
  const [userRole, setUserRole] = useState('ATHLETE');
  const [roleConfig, setRoleConfig] = useState<DashboardRoleConfig>(
    getDashboardRoleConfig('ATHLETE'),
  );
  const [userPhoto, setUserPhoto] = useState('');

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
      const normalizedRole = normalizeDashboardRole(data.role);
      const nextRoleConfig = getDashboardRoleConfig(normalizedRole);
      const fullName = [data.first_name, data.last_name].filter(Boolean).join(' ');
      setUserName(fullName || nextRoleConfig.roleLabel);
      setUserRole(nextRoleConfig.role);
      setRoleConfig(nextRoleConfig);

      if (!isDashboardPathAllowedForRole(pathname, normalizedRole)) {
        router.replace(nextRoleConfig.dashboardPath);
        return;
      }

      if (data.profile_image) {
        setUserPhoto(data.profile_image);
      }

      // Fetch latest user data from API to get updated profile_image
      const loadLatestUser = async () => {
        try {
          const res = await fetchWithAuth(`/users/${data.id}`);
          if (!res?.ok) return;
          const updated = await res.json();
          if (updated.profile_image) {
            setUserPhoto(updated.profile_image);
          }
          const latestRole = normalizeDashboardRole(updated.role);
          const latestRoleConfig = getDashboardRoleConfig(latestRole);
          setUserRole(latestRoleConfig.role);
          setRoleConfig(latestRoleConfig);

          if (!isDashboardPathAllowedForRole(pathname, latestRole)) {
            router.replace(latestRoleConfig.dashboardPath);
            return;
          }

          localStorage.setItem('user', JSON.stringify(updated));
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      };
      loadLatestUser();
    } catch {
      const fallbackRoleConfig = getDashboardRoleConfig('ATHLETE');
      setUserName(fallbackRoleConfig.roleLabel);
      setUserRole(fallbackRoleConfig.role);
      setRoleConfig(fallbackRoleConfig);
    }
  }, [pathname, router]);

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandRow}>
          <img src="/PlayVerified Logo.png" alt="PlayVerified" style={styles.brandLogo} />
        </div>

        <div style={styles.profileCard}>
          <div
            style={{
              ...styles.profileAvatar,
              ...(userPhoto ? { backgroundImage: `url(${userPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', color: 'transparent' } : {}),
            }}
          >
            {!userPhoto && (userName?.charAt(0) || 'A')}
          </div>
          <div>
            <div style={styles.profileName}>{userName}</div>
            <div style={styles.profileRole}>{userRole}</div>
          </div>
        </div>

        <div style={styles.navSection}>
          {roleConfig.navGroups.map((group) => (
            <div key={group.label} style={styles.navGroup}>
              <div style={styles.sectionLabel}>{group.label}</div>
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname?.startsWith(`${item.href}/`);

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
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  brandRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 0,
    padding: '0',
  },
  brandLogo: {
    width: 200,
    height: 200,
    borderRadius: 5,
    objectFit: 'contain',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: theme.colors.white,
    textAlign: 'center' as const,
    letterSpacing: 0.5,
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
    marginBottom: 16,
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
