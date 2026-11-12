"use client";

import Link from "next/link";
import ParentShell from "./parents/ParentShell";
import { dashboardNavIcons } from "./core/nav-icons";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { theme } from "../styles/theme";
import { fetchWithAuth } from "../lib/api";
import coach from "./coach-shell.module.css";
import {
  getDashboardRoleConfig,
  isDashboardPathAllowedForRole,
  normalizeDashboardRole,
  type DashboardRoleConfig,
} from "./core/roles";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("ATHLETE");
  const [identityReady, setIdentityReady] = useState(false);
  const [roleConfig, setRoleConfig] = useState<DashboardRoleConfig>(
    getDashboardRoleConfig("ATHLETE"),
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [userPhoto, setUserPhoto] = useState("");
  const [canPublish, setCanPublish] = useState(false);
  useEffect(() => {
    let active = true;
    fetchWithAuth("/resources/capabilities")
      .then(async (res) => {
        if (res?.ok) {
          const data = await res.json();
          if (active) setCanPublish(data.can_publish === true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const stored = localStorage.getItem("user");
    if (!stored) return;

    try {
      const data = JSON.parse(stored);
      const normalizedRole = normalizeDashboardRole(data.role);
      const nextRoleConfig = getDashboardRoleConfig(normalizedRole);
      const fullName = [data.first_name, data.last_name]
        .filter(Boolean)
        .join(" ");
      setUserName(fullName || nextRoleConfig.roleLabel);
      setUserRole(nextRoleConfig.role);
      setIdentityReady(true);
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

          localStorage.setItem("user", JSON.stringify(updated));
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      };
      loadLatestUser();
    } catch {
      const fallbackRoleConfig = getDashboardRoleConfig("ATHLETE");
      setUserName(fallbackRoleConfig.roleLabel);
      setUserRole(fallbackRoleConfig.role);
      setRoleConfig(fallbackRoleConfig);
    }
  }, [pathname, router]);

  useEffect(() => {
    const updated = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (!data) return;
      setUserName(
        [data.first_name, data.last_name].filter(Boolean).join(" ") || "Coach",
      );
      setUserPhoto(data.profile_image || "");
    };
    window.addEventListener("profile-updated", updated);
    return () => window.removeEventListener("profile-updated", updated);
  }, []);

  useEffect(() => {
    if (userRole !== "COACH") return;
    let active = true;
    const refresh = () =>
      fetchWithAuth("/team-hub/summary")
        .then(async (res) => {
          if (res?.ok) {
            const data = await res.json();
            if (active) setPendingCount(data.pending || 0);
          }
        })
        .catch(() => {});
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener("attendance-updated", refresh);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("attendance-updated", refresh);
    };
  }, [userRole]);

  if (!identityReady)
    return <main aria-busy="true">Loading your workspace…</main>;
  if (userRole === "GUARDIAN")
    return <ParentShell name={userName}>{children}</ParentShell>;

  if (userRole === "COACH" || userRole === "ATHLETE")
    return (
      <div className={coach.shell}>
        <a href="#coach-content" className={coach.skip}>
          Skip to content
        </a>
        <aside className={coach.sidebar}>
          <Link href={roleConfig.dashboardPath} className={coach.brand}>
            <img
              src="/PlayVerified Logo.png"
              alt="PlayVerified"
              width="176"
              height="60"
            />
          </Link>
          <p className={coach.label}>
            {userRole === "COACH" ? "COACH WORKSPACE" : "ATHLETE WORKSPACE"}
          </p>
          <nav
            className={coach.nav}
            aria-label={`${roleConfig.roleLabel} navigation`}
          >
            {roleConfig.navGroups[0].items.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  pathname === item.href ||
                  (index !== 0 && pathname.startsWith(`${item.href}/`))
                    ? "page"
                    : undefined
                }
              >
                <span aria-hidden="true">
                  {dashboardNavIcons[item.name]}
                </span>
                <span>
                  {item.name}
                  {item.name === "Verification" && pendingCount > 0
                    ? ` (${pendingCount})`
                    : ""}
                </span>
              </Link>
            ))}
            {canPublish && (
              <Link
                href="/dashboard/resources-admin"
                aria-current={
                  pathname.startsWith("/dashboard/resources-admin")
                    ? "page"
                    : undefined
                }
              >
                <span aria-hidden="true">▧</span>
                <span>Manage resources</span>
              </Link>
            )}
          </nav>
          <div className={coach.account}>
            <span className={coach.avatar}>
              {userPhoto ? (
                <img src={userPhoto} alt={`${userName}'s profile photo`} />
              ) : (
                userName.charAt(0)
              )}
            </span>
            <div className={coach.accountDetails}>
              <strong>{userName}</strong>
              <small>{roleConfig.roleLabel}</small>
            </div>
          </div>
          <button
            className={coach.logout}
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
          >
            Log out
          </button>
        </aside>
        <main id="coach-content" className={coach.main}>
          {children}
        </main>
      </div>
    );

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.brandRow}>
          <img
            src="/PlayVerified Logo.png"
            alt="PlayVerified"
            style={styles.brandLogo}
          />
        </div>

        <div style={styles.profileCard}>
          <div
            style={{
              ...styles.profileAvatar,
              ...(userPhoto
                ? {
                    backgroundImage: `url(${userPhoto})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    color: "transparent",
                  }
                : {}),
            }}
          >
            {!userPhoto && (userName?.charAt(0) || "A")}
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
    display: "flex",
    minHeight: "100vh",
    background: theme.colors.background,
  },
  sidebar: {
    width: 280,
    background: "#0b1f2e",
    color: theme.colors.white,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  brandRow: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 0,
    padding: "0",
  },
  brandLogo: {
    width: 200,
    height: 200,
    borderRadius: 5,
    objectFit: "contain",
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: theme.colors.white,
    textAlign: "center" as const,
    letterSpacing: 0.5,
  },
  brandText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: 18,
    marginBottom: 16,
    borderRadius: 20,
    background: "#12233a",
  },
  profileAvatar: {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
    borderRadius: "50%",
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
    color: "#94a3b8",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#94a3b8",
    letterSpacing: "0.08em",
  },
  navLink: {
    display: "block",
    color: "#cbd5e1",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 14,
    transition: "background 0.2s ease, color 0.2s ease",
  },
  navLinkActive: {
    color: theme.colors.white,
    background: "#1f6f8b",
  },
  main: {
    flex: 1,
    padding: 30,
    minHeight: "100vh",
    overflowX: "hidden",
  },
};
