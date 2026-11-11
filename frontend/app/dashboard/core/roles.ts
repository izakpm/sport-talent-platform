export type DashboardRole = 'ATHLETE' | 'COACH' | 'SCHOOL';

export type DashboardNavItem = {
  name: string;
  href: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardRoleConfig = {
  role: DashboardRole;
  roleLabel: string;
  dashboardPath: string;
  navGroups: DashboardNavGroup[];
};

const roleScopedPrefixes: Array<{ prefix: string; role: DashboardRole }> = [
  { prefix: '/dashboard/athlete', role: 'ATHLETE' },
  { prefix: '/dashboard/coaches', role: 'COACH' },
  { prefix: '/dashboard/schools', role: 'SCHOOL' },
];

const roleConfigs: Record<DashboardRole, DashboardRoleConfig> = {
  ATHLETE: {
    role: 'ATHLETE',
    roleLabel: 'Athlete',
    dashboardPath: '/dashboard/athlete',
    navGroups: [
      {
        label: 'Athlete',
        items: [{ name: 'My Profile', href: '/dashboard/profile' }],
      },
      {
        label: 'Dashboards',
        items: [{ name: 'My Dashboard', href: '/dashboard/athlete' }],
      },
      {
        label: 'Pages',
        items: [
          { name: 'Team feed', href: '/dashboard/athlete/feed' },
          { name: 'Attendance', href: '/dashboard/athlete/attendance' },
          { name: 'Activities', href: '/dashboard/athlete/activities' },
          { name: 'Matches', href: '/dashboard/athlete/matches' },
          { name: 'Achievements', href: '/dashboard/athlete/achievements' },
          { name: 'Sports', href: '/dashboard/athlete/sports' },
          { name: 'Calendar', href: '/dashboard/athlete/calendar' },
          { name: 'Connections', href: '/dashboard/athlete/connections' },
        ],
      },
    ],
  },
  COACH: {
    role: 'COACH',
    roleLabel: 'Coach',
    dashboardPath: '/dashboard/coaches',
    navGroups: [
      {
        label: 'Coach workspace',
        items: [
          { name: 'Overview', href: '/dashboard/coaches' },
          { name: 'Teams', href: '/dashboard/coaches/teams' },
          { name: 'Schedule', href: '/dashboard/coaches/schedule' },
          { name: 'Team feed', href: '/dashboard/coaches/feed' },
          { name: 'Verification', href: '/dashboard/coaches/verification' },
          { name: 'Achievements', href: '/dashboard/coaches/achievements' },
          { name: 'Coaching history', href: '/dashboard/coaches/history' },
          { name: 'Qualifications', href: '/dashboard/coaches/qualifications' },
        ],
      },
    ],
  },
  SCHOOL: {
    role: 'SCHOOL',
    roleLabel: 'School',
    dashboardPath: '/dashboard/schools',
    navGroups: [
      {
        label: 'School',
        items: [{ name: 'My Profile', href: '/dashboard/profile' }],
      },
      {
        label: 'Dashboards',
        items: [{ name: 'My Dashboard', href: '/dashboard/schools' }],
      },
      {
        label: 'Pages',
        items: [
          { name: 'Coaches', href: '/dashboard/schools/coaches' },
          { name: 'Teams', href: '/dashboard/schools/teams' },
          { name: 'Fixtures', href: '/dashboard/schools/fixtures' },
          { name: 'Logs', href: '/dashboard/schools/logs' },
          { name: 'Achievements', href: '/dashboard/schools/achievements' },
        ],
      },
    ],
  },
};

export function normalizeDashboardRole(role: string | null | undefined): DashboardRole {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'COACH') return 'COACH';
  if (normalized === 'SCHOOL') return 'SCHOOL';
  return 'ATHLETE';
}

export function getDashboardRoleConfig(role: DashboardRole): DashboardRoleConfig {
  return roleConfigs[role];
}

export function isDashboardPathAllowedForRole(
  pathname: string | null | undefined,
  role: DashboardRole,
): boolean {
  if (!pathname) return true;

  for (const scoped of roleScopedPrefixes) {
    const matchesScopedArea =
      pathname === scoped.prefix || pathname.startsWith(`${scoped.prefix}/`);

    if (matchesScopedArea) {
      return scoped.role === role;
    }
  }

  return true;
}
