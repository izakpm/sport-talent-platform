'use client';

import { type CSSProperties } from 'react';
import { theme } from '../../styles/theme';

export default function DashboardConnectionsPage() {
  const connections = [
    { id: 1, name: 'Coach Taylor', role: 'Coach', status: 'Active' },
    { id: 2, name: 'Scout Morgan', role: 'Scout', status: 'Pending' },
    { id: 3, name: 'Training Partner', role: 'Partner', status: 'Active' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Athlete Network</p>
          <h1 style={styles.heading}>Connections</h1>
          <p style={styles.description}>Monitor the people who are connected to your athlete profile and contact them when needed.</p>
        </div>
      </div>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Your Connections</h2>
        <div style={styles.list}>
          {connections.map((connection) => (
            <div key={connection.id} style={styles.connectionItem}>
              <div>
                <div style={styles.connectionName}>{connection.name}</div>
                <div style={styles.connectionRole}>{connection.role}</div>
              </div>
              <div style={styles.statusBadge}>{connection.status}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 24,
  },
  kicker: {
    color: theme.colors.primary,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 8,
  },
  heading: {
    margin: 0,
    fontSize: 32,
    color: theme.colors.textPrimary,
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textMuted,
    maxWidth: 620,
  },
  card: {
    background: theme.colors.card,
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
  },
  cardTitle: {
    margin: 0,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: 700,
  },
  list: {
    display: 'grid',
    gap: 14,
  },
  connectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  connectionName: {
    fontSize: 16,
    fontWeight: 700,
  },
  connectionRole: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    background: theme.colors.primary,
    color: theme.colors.white,
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
  },
};
