"use client";

import React from "react";
import { theme } from "../../styles/theme";

const navItems = ["Dashboard", "Profile", "Activities", "Connections", "Achievements", "Sports"];

const approvalLog = [
  {
    component: "Vertical menu + active state",
    source: "/dashboard/layout",
    status: "Approved",
    note: "Used by the athlete dashboard shell navigation.",
  },
  {
    component: "Hero cards and stat cards",
    source: "/dashboard, /dashboard/schools",
    status: "Approved",
    note: "Primary summary layout patterns are consistent.",
  },
  {
    component: "Coach profile shell variant",
    source: "/dashboard/coaches",
    status: "Approved",
    note: "Coach-specific frontend shell implemented with role-focused cards, actions, and schedule list.",
  },
  {
    component: "Form validation states",
    source: "global",
    status: "Approved",
    note: "Default, focus, error, and disabled states documented below.",
  },
];

export default function ThemePreviewPage() {
  const styles: any = {
    page: {
      padding: 24,
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      background: theme.colors.background,
      color: theme.typography.body.color,
      minHeight: '100vh',
    },
    container: {
      maxWidth: 1240,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    card: {
      background: theme.colors.card,
      padding: theme.spacing.cardPadding,
      borderRadius: theme.spacing.borderRadius,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      border: `1px solid ${theme.colors.border}`,
    },
    heading: {
      color: theme.typography.heading.color,
      fontSize: theme.typography.heading.fontSize,
      margin: 0,
    },
    muted: {
      color: theme.typography.muted.color,
      marginTop: 8,
      lineHeight: 1.7,
    },
    purposeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 12,
      marginTop: 16,
    },
    purposeItem: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      padding: 12,
      background: '#f8fafc',
    },
    sectionTitle: {
      margin: 0,
      fontSize: 18,
      color: theme.colors.textPrimary,
    },
    sectionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: 16,
      marginTop: 12,
    },
    visualBlock: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 14,
      padding: 14,
      background: theme.colors.white,
    },
    blockTitle: {
      margin: 0,
      fontSize: 15,
      fontWeight: 700,
      color: theme.colors.textPrimary,
    },
    blockLabel: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    menuDemo: {
      marginTop: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 10,
      borderRadius: 12,
      background: '#0b1f2e',
    },
    menuItem: {
      color: '#cbd5e1',
      padding: '10px 12px',
      borderRadius: 10,
      textDecoration: 'none',
      fontWeight: 600,
      border: '1px solid transparent',
    },
    menuItemActive: {
      color: theme.colors.white,
      background: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    tabRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    tab: {
      padding: '8px 12px',
      borderRadius: 999,
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textMuted,
      fontWeight: 600,
      background: '#f8fafc',
    },
    tabActive: {
      color: theme.colors.white,
      background: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    buttonRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    primaryBtn: {
      background: theme.colors.primary,
      color: theme.colors.white,
      padding: '10px 14px',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 700,
    },
    secondaryBtn: {
      background: theme.colors.accent,
      color: theme.colors.textPrimary,
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${theme.colors.border}`,
      cursor: 'pointer',
      fontWeight: 700,
    },
    ghostBtn: {
      background: 'transparent',
      color: theme.colors.textPrimary,
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${theme.colors.border}`,
      cursor: 'pointer',
      fontWeight: 700,
    },
    disabledBtn: {
      background: theme.colors.grey[100],
      color: theme.colors.grey[600],
      padding: '10px 14px',
      borderRadius: 10,
      border: `1px solid ${theme.colors.border}`,
      cursor: 'not-allowed',
      fontWeight: 700,
    },
    formGrid: {
      marginTop: 10,
      display: 'grid',
      gap: 8,
    },
    input: {
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    inputFocus: {
      padding: 10,
      borderRadius: 10,
      border: `2px solid ${theme.colors.primary}`,
      background: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      fontSize: 14,
      outline: 'none',
    },
    inputError: {
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${theme.colors.error}`,
      background: '#fef2f2',
      color: theme.colors.textPrimary,
      fontSize: 14,
    },
    inputDisabled: {
      padding: 10,
      borderRadius: 10,
      border: `1px solid ${theme.colors.border}`,
      background: '#f3f4f6',
      color: theme.colors.grey[600],
      fontSize: 14,
      cursor: 'not-allowed',
    },
    helper: {
      margin: 0,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    errorText: {
      margin: 0,
      fontSize: 12,
      color: theme.colors.error,
    },
    cardGrid: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 8,
    },
    miniCard: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      background: '#f8fafc',
      padding: 10,
    },
    badgeRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    badge: {
      display: 'inline-block',
      padding: '5px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      background: theme.colors.accent,
      color: theme.colors.textPrimary,
    },
    badgeSuccess: {
      background: '#dcfce7',
      color: '#166534',
    },
    badgeWarning: {
      background: '#fef3c7',
      color: '#92400e',
    },
    badgeError: {
      background: '#fee2e2',
      color: '#991b1b',
    },
    alertStack: {
      display: 'grid',
      gap: 8,
      marginTop: 10,
    },
    alert: {
      borderRadius: 10,
      padding: 10,
      border: `1px solid ${theme.colors.border}`,
      background: '#eff6ff',
      color: theme.colors.textPrimary,
      fontSize: 13,
    },
    alertWarning: {
      background: '#fffbeb',
      borderColor: '#fbbf24',
    },
    alertError: {
      background: '#fef2f2',
      borderColor: '#ef4444',
    },
    list: {
      margin: '10px 0 0',
      paddingLeft: 18,
      lineHeight: 1.7,
    },
    tableWrap: {
      marginTop: 10,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: 13,
    },
    th: {
      textAlign: 'left',
      background: '#f8fafc',
      padding: '10px 12px',
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    td: {
      padding: '10px 12px',
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    tokenGrid: {
      marginTop: 10,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 8,
    },
    token: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: theme.colors.white,
    },
    tokenSwatch: {
      height: 48,
      borderBottom: `1px solid ${theme.colors.border}`,
    },
    tokenMeta: {
      padding: 8,
      fontSize: 12,
      color: theme.colors.textMuted,
      lineHeight: 1.5,
    },
    flowList: {
      marginTop: 12,
      display: 'grid',
      gap: 8,
    },
    flowItem: {
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 10,
      padding: 10,
      background: '#f8fafc',
      fontSize: 13,
      lineHeight: 1.6,
    },
    logWrap: {
      marginTop: 10,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 12,
      overflow: 'hidden',
    },
    statusApproved: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: '#dcfce7',
      color: '#166534',
    },
    statusFix: {
      display: 'inline-block',
      padding: '3px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 700,
      background: '#fee2e2',
      color: '#991b1b',
    },
    motionCard: {
      marginTop: 10,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 10,
      padding: 10,
      background: '#f8fafc',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    pulseDot: {
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: theme.colors.primary,
      animation: 'pulse 1.6s infinite',
    },
    footerNote: {
      marginTop: 6,
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    strong: {
      color: theme.colors.textPrimary,
    },
    codeLike: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
      fontSize: 12,
      background: '#f3f4f6',
      borderRadius: 6,
      padding: '2px 6px',
      border: `1px solid ${theme.colors.border}`,
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <style jsx global>{`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.35); opacity: 0.4; }
            100% { transform: scale(1); opacity: 0.9; }
          }
        `}</style>

        <div style={styles.card}>
          <h1 style={styles.heading}>UX Test and Visual Approval Baseline</h1>
          <p style={styles.muted}>
            This page is the mandatory first-step design review gate. It showcases all currently used and newly proposed visuals before those visuals are used in feature routes.
          </p>
          <p style={styles.footerNote}>
            <span style={styles.statusApproved}>Approved on 2026-07-13</span>
          </p>

          <div style={styles.purposeGrid}>
            <div style={styles.purposeItem}>
              <div style={styles.blockTitle}>Scope</div>
              <p style={styles.footerNote}>Menus, lists, cards, buttons, forms, alerts, badges, tables, and color tokens.</p>
            </div>
            <div style={styles.purposeItem}>
              <div style={styles.blockTitle}>Rule</div>
              <p style={styles.footerNote}>New UI visuals must appear here first and be approved before feature-page rollout.</p>
            </div>
            <div style={styles.purposeItem}>
              <div style={styles.blockTitle}>Route</div>
              <p style={styles.footerNote}><span style={styles.codeLike}>frontend/app/dev/theme-preview/page.tsx</span></p>
            </div>
            <div style={styles.purposeItem}>
              <div style={styles.blockTitle}>Review mode</div>
              <p style={styles.footerNote}>Check desktop and mobile widths before marking a visual as approved.</p>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Navigation and Menus</h2>
          <div style={styles.sectionGrid}>
            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Vertical side menu</h3>
              <div style={styles.blockLabel}>state: default + active</div>
              <div style={styles.menuDemo}>
                {navItems.map((item, index) => (
                  <a key={item} href="#" style={{ ...styles.menuItem, ...(index === 0 ? styles.menuItemActive : {}) }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Segment tabs + breadcrumb style</h3>
              <div style={styles.blockLabel}>state: selected + unselected</div>
              <div style={styles.tabRow}>
                <span style={{ ...styles.tab, ...styles.tabActive }}>Athlete</span>
                <span style={styles.tab}>Coach</span>
                <span style={styles.tab}>School</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <span style={styles.codeLike}>Dashboard / Profile / Overview</span>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Buttons and Actions</h2>
          <div style={styles.sectionGrid}>
            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Button variants</h3>
              <div style={styles.blockLabel}>state: primary / secondary / ghost / disabled</div>
              <div style={styles.buttonRow}>
                <button style={styles.primaryBtn}>Primary</button>
                <button style={styles.secondaryBtn}>Secondary</button>
                <button style={styles.ghostBtn}>Ghost</button>
                <button style={styles.disabledBtn} disabled>Disabled</button>
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Common action grouping</h3>
              <div style={styles.blockLabel}>usage: save/cancel/secondary action</div>
              <div style={styles.buttonRow}>
                <button style={styles.primaryBtn}>Save changes</button>
                <button style={styles.secondaryBtn}>Cancel</button>
                <button style={styles.ghostBtn}>More options</button>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Inputs and Form States</h2>
          <div style={styles.sectionGrid}>
            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Text fields and select</h3>
              <div style={styles.blockLabel}>state: default + focus + disabled</div>
              <div style={styles.formGrid}>
                <input style={styles.input} placeholder="Default input" />
                <input style={styles.inputFocus} value="Focused style preview" readOnly />
                <input style={styles.inputDisabled} value="Disabled field" disabled readOnly />
                <select style={styles.input} defaultValue="">
                  <option value="" disabled>Select option</option>
                  <option value="1">Option one</option>
                  <option value="2">Option two</option>
                </select>
                <textarea style={styles.input} rows={3} placeholder="Textarea input" />
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Validation and helper text</h3>
              <div style={styles.blockLabel}>state: helper + error</div>
              <div style={styles.formGrid}>
                <input style={styles.input} placeholder="Email address" />
                <p style={styles.helper}>Helper: Use a valid school or team email where possible.</p>
                <input style={styles.inputError} value="invalid-email" readOnly />
                <p style={styles.errorText}>Error: Enter a valid email address.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Lists, Cards, and Table Patterns</h2>
          <div style={styles.sectionGrid}>
            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>List pattern</h3>
              <div style={styles.blockLabel}>usage: activity stream and checklist rows</div>
              <ul style={styles.list}>
                <li><span style={styles.strong}>Athlete profile updated</span> with new position and metrics.</li>
                <li><span style={styles.strong}>Coach request pending</span> for approval.</li>
                <li><span style={styles.strong}>School achievement</span> verified and published.</li>
              </ul>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Card cluster pattern</h3>
              <div style={styles.blockLabel}>usage: dashboard KPI summaries</div>
              <div style={styles.cardGrid}>
                <div style={styles.miniCard}><div style={styles.blockLabel}>Teams</div><strong>8</strong></div>
                <div style={styles.miniCard}><div style={styles.blockLabel}>Coaches</div><strong>24</strong></div>
                <div style={styles.miniCard}><div style={styles.blockLabel}>Activities</div><strong>142</strong></div>
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Compact table row pattern</h3>
              <div style={styles.blockLabel}>usage: approval logs and list admin views</div>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Owner</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={styles.td}>Coach profile shell</td>
                      <td style={styles.td}>Frontend</td>
                      <td style={styles.td}><span style={styles.statusFix}>Fix needed</span></td>
                    </tr>
                    <tr>
                      <td style={styles.td}>School menu flow</td>
                      <td style={styles.td}>Frontend</td>
                      <td style={styles.td}><span style={styles.statusApproved}>Approved</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Badges, Alerts, and Motion</h2>
          <div style={styles.sectionGrid}>
            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Badge states</h3>
              <div style={styles.blockLabel}>usage: verification and moderation status</div>
              <div style={styles.badgeRow}>
                <span style={styles.badge}>Draft</span>
                <span style={{ ...styles.badge, ...styles.badgeSuccess }}>Verified</span>
                <span style={{ ...styles.badge, ...styles.badgeWarning }}>Pending</span>
                <span style={{ ...styles.badge, ...styles.badgeError }}>Rejected</span>
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Alert messages</h3>
              <div style={styles.blockLabel}>usage: info, warning, and error feedback</div>
              <div style={styles.alertStack}>
                <div style={styles.alert}>Info: Guardian approval is required before profile visibility changes.</div>
                <div style={{ ...styles.alert, ...styles.alertWarning }}>Warning: Some coach details are incomplete.</div>
                <div style={{ ...styles.alert, ...styles.alertError }}>Error: Save failed. Retry after correcting invalid fields.</div>
              </div>
            </div>

            <div style={styles.visualBlock}>
              <h3 style={styles.blockTitle}>Motion sample</h3>
              <div style={styles.blockLabel}>usage: subtle status pulse only, no distracting motion</div>
              <div style={styles.motionCard}>
                <span>Approval watcher active</span>
                <span style={styles.pulseDot} />
              </div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Color Token Baseline</h2>
          <div style={styles.tokenGrid}>
            {Object.entries(theme.colors)
              .filter(([name]) => typeof theme.colors[name as keyof typeof theme.colors] === 'string')
              .map(([name, value]) => (
                <div key={name} style={styles.token}>
                  <div style={{ ...styles.tokenSwatch, background: value as string }} />
                  <div style={styles.tokenMeta}>
                    <div>{name}</div>
                    <div style={styles.codeLike}>{value as string}</div>
                  </div>
                </div>
              ))}
          </div>
          <p style={styles.footerNote}>Grey scale tokens are used primarily for borders, disabled states, and neutral surfaces.</p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Visual Approval Workflow</h2>
          <div style={styles.flowList}>
            <div style={styles.flowItem}>1. Add or update the visual in this page with a clear state label.</div>
            <div style={styles.flowItem}>2. Review at desktop and mobile widths and verify token consistency.</div>
            <div style={styles.flowItem}>3. Mark as approved in the approval log table before rollout.</div>
            <div style={styles.flowItem}>4. Only after approval, apply the visual to feature routes or update global tokens.</div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>Approval Log</h2>
          <div style={styles.logWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Visual component</th>
                  <th style={styles.th}>Source route</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Review note</th>
                </tr>
              </thead>
              <tbody>
                {approvalLog.map((entry) => (
                  <tr key={entry.component}>
                    <td style={styles.td}>{entry.component}</td>
                    <td style={styles.td}><span style={styles.codeLike}>{entry.source}</span></td>
                    <td style={styles.td}>
                      <span style={entry.status === "Approved" ? styles.statusApproved : styles.statusFix}>
                        {entry.status}
                      </span>
                    </td>
                    <td style={styles.td}>{entry.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={styles.footerNote}>Log updates are required whenever a new visual primitive is proposed or changed.</p>
        </div>
      </div>
    </div>
  );
}
