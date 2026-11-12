export type DashboardRole = "ATHLETE" | "COACH" | "SCHOOL" | "GUARDIAN";

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
  { prefix: "/dashboard/parents", role: "GUARDIAN" },
  { prefix: "/dashboard/athlete", role: "ATHLETE" },
  { prefix: "/dashboard/coaches", role: "COACH" },
  { prefix: "/dashboard/schools", role: "SCHOOL" },
];

const roleConfigs: Record<DashboardRole, DashboardRoleConfig> = {
  GUARDIAN: {
    role: "GUARDIAN",
    roleLabel: "Parent / Guardian",
    dashboardPath: "/dashboard/parents",
    navGroups: [
      {
        label: "Family workspace",
        items: [{ name: "My children", href: "/dashboard/parents" }],
      },
    ],
  },
  ATHLETE: {
    role: "ATHLETE",
    roleLabel: "Athlete",
    dashboardPath: "/dashboard/athlete",
    navGroups: [
      {
        label: "Athlete workspace",
        items: [
          { name: "Dashboard", href: "/dashboard/athlete" },
          { name: "Profile", href: "/dashboard/profile" },
          { name: "Activities", href: "/dashboard/athlete/activities" },
          { name: "Matches", href: "/dashboard/athlete/matches" },
          { name: "Calendar", href: "/dashboard/athlete/calendar" },
          { name: "Team Feed", href: "/dashboard/athlete/feed" },
          { name: "Connections", href: "/dashboard/athlete/connections" },
          { name: "Resources", href: "/dashboard/athlete/resources" },
        ],
      },
    ],
  },
  COACH: {
    role: "COACH",
    roleLabel: "Coach",
    dashboardPath: "/dashboard/coaches",
    navGroups: [
      {
        label: "Coach workspace",
        items: [
          { name: "Dashboard", href: "/dashboard/coaches" },
          { name: "Profile", href: "/dashboard/profile" },
          { name: "Teams", href: "/dashboard/coaches/teams" },
          { name: "Schedule", href: "/dashboard/coaches/schedule" },
          { name: "Matches", href: "/dashboard/coaches/matches" },
          { name: "Team Feed", href: "/dashboard/coaches/feed" },
          { name: "Verification", href: "/dashboard/coaches/verification" },
        ],
      },
    ],
  },
  SCHOOL: {
    role: "SCHOOL",
    roleLabel: "School",
    dashboardPath: "/dashboard/schools",
    navGroups: [
      {
        label: "School",
        items: [{ name: "My Profile", href: "/dashboard/profile" }],
      },
      {
        label: "Dashboards",
        items: [{ name: "My Dashboard", href: "/dashboard/schools" }],
      },
      {
        label: "Pages",
        items: [
          { name: "Coaches", href: "/dashboard/schools/coaches" },
          { name: "Teams", href: "/dashboard/schools/teams" },
          { name: "Fixtures", href: "/dashboard/schools/fixtures" },
          { name: "Logs", href: "/dashboard/schools/logs" },
          { name: "Achievements", href: "/dashboard/schools/achievements" },
        ],
      },
    ],
  },
};

export function normalizeDashboardRole(
  role: string | null | undefined,
): DashboardRole {
  const normalized = (role || "").toUpperCase();
  if (normalized === "GUARDIAN") return "GUARDIAN";
  if (normalized === "COACH") return "COACH";
  if (normalized === "SCHOOL") return "SCHOOL";
  return "ATHLETE";
}

export function getDashboardRoleConfig(
  role: DashboardRole,
): DashboardRoleConfig {
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
      return (
        scoped.role === role ||
        (role === "GUARDIAN" && scoped.role === "ATHLETE")
      );
    }
  }

  return true;
}
