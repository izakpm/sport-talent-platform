'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { COACH_APPROVALS, type CoachApproval } from '../mock-data';

export default function CoachApprovalsPage() {
  const [approvals, setApprovals] = useState(COACH_APPROVALS);
  const [selectedType, setSelectedType] = useState<'All' | CoachApproval['type']>('All');

  const pending = approvals.filter((item) => item.status === 'Pending');
  const approvedCount = approvals.filter((item) => item.status === 'Approved').length;
  const rejectedCount = approvals.filter((item) => item.status === 'Rejected').length;

  const visibleApprovals = useMemo(() => {
    return pending.filter((item) => selectedType === 'All' || item.type === selectedType);
  }, [pending, selectedType]);

  const handleDecision = (id: string, status: 'Approved' | 'Rejected') => {
    setApprovals((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  };

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>Coach Pages</p>
      <h1 style={styles.heading}>Approvals</h1>
      <p style={styles.text}>Handle pending approvals and verification actions for athlete and team submissions.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Pending" value={pending.length} />
        <MetricCard label="Approved" value={approvedCount} />
        <MetricCard label="Rejected" value={rejectedCount} />
      </div>

      <SurfaceCard style={styles.filterCard}>
        <select
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value as 'All' | CoachApproval['type'])}
          style={styles.select}
        >
          <option value="All">All request types</option>
          <option value="Athlete Verification">Athlete Verification</option>
          <option value="Match Report">Match Report</option>
          <option value="Team Update">Team Update</option>
        </select>
      </SurfaceCard>

      <SurfaceCard style={styles.listCard}>
        <h2 style={styles.cardHeading}>Pending Queue</h2>
        <div style={styles.queueList}>
          {visibleApprovals.map((item) => (
            <div key={item.id} style={styles.queueRow}>
              <div>
                <div style={styles.itemTitle}>{item.subject}</div>
                <div style={styles.itemMeta}>
                  {item.type} • {item.submittedBy} • {new Date(item.submittedAt).toLocaleString()}
                </div>
              </div>
              <div style={styles.queueActions}>
                <StatusPill label={item.status} tone="warning" />
                <ActionButton label="Approve" tone="success" onClick={() => handleDecision(item.id, 'Approved')} />
                <ActionButton label="Reject" tone="neutral" onClick={() => handleDecision(item.id, 'Rejected')} />
              </div>
            </div>
          ))}
          {!visibleApprovals.length ? <p style={styles.emptyText}>No pending approvals in this filter.</p> : null}
        </div>
      </SurfaceCard>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 18 },
  kicker: { margin: 0, color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  heading: { margin: 0, color: theme.colors.textPrimary, fontSize: 32 },
  text: { margin: 0, color: theme.colors.textMuted, lineHeight: 1.7 },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  filterCard: {
    padding: 16,
  },
  select: {
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    padding: '10px 12px',
    color: theme.colors.textPrimary,
    minWidth: 240,
  },
  listCard: {
    padding: 18,
  },
  cardHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  queueList: {
    display: 'grid',
    gap: 10,
  },
  queueRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    background: theme.colors.background,
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemTitle: {
    color: theme.colors.textPrimary,
    fontWeight: 700,
  },
  itemMeta: {
    marginTop: 4,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  queueActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  emptyText: {
    margin: 0,
    color: theme.colors.textMuted,
  },
};
