'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, DetailList, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { COACH_TEAMS } from '../mock-data';

export default function CoachTeamsPage() {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Preseason' | 'Offseason'>('All');
  const [selectedTeamId, setSelectedTeamId] = useState(COACH_TEAMS[0]?.id ?? '');
  const [notice, setNotice] = useState('');

  const filteredTeams = useMemo(() => {
    return COACH_TEAMS.filter((team) => {
      const matchesStatus = statusFilter === 'All' || team.status === statusFilter;
      const matchesQuery =
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.sport.toLowerCase().includes(query.toLowerCase()) ||
        team.ageGroup.toLowerCase().includes(query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter]);

  const selectedTeam = filteredTeams.find((team) => team.id === selectedTeamId) ?? filteredTeams[0] ?? null;
  const totalAthletes = filteredTeams.reduce((sum, team) => sum + team.athleteCount, 0);
  const totalAssistants = filteredTeams.reduce((sum, team) => sum + team.assistantCoaches, 0);

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>Coach Pages</p>
      <h1 style={styles.heading}>Teams</h1>
      <p style={styles.text}>Manage team rosters, assign athletes, and track squad structure from this coach workspace.</p>

      <div style={styles.metricsGrid}>
        <MetricCard label="Visible teams" value={filteredTeams.length} note="Filtered by current view." />
        <MetricCard label="Athletes" value={totalAthletes} note="Across currently visible squads." />
        <MetricCard label="Assistant coaches" value={totalAssistants} note="Supporting your programs." />
      </div>

      <SurfaceCard style={styles.controlsCard}>
        <div style={styles.controlsRow}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search team, sport, or age group"
            style={styles.input}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'All' | 'Active' | 'Preseason' | 'Offseason')}
            style={styles.select}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="Preseason">Preseason</option>
            <option value="Offseason">Offseason</option>
          </select>
          <ActionButton
            label="Create Team"
            onClick={() => setNotice('Team creation flow will connect when backend contracts are finalized.')}
          />
        </div>
        {notice ? <p style={styles.notice}>{notice}</p> : null}
      </SurfaceCard>

      <div style={styles.contentGrid}>
        <SurfaceCard style={styles.listCard}>
          <h2 style={styles.cardHeading}>Team List</h2>
          <div style={styles.teamList}>
            {filteredTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                style={{
                  ...styles.teamRow,
                  ...(selectedTeam?.id === team.id ? styles.teamRowActive : {}),
                }}
              >
                <div>
                  <div style={styles.teamName}>{team.name}</div>
                  <div style={styles.teamMeta}>{team.sport} • {team.ageGroup}</div>
                </div>
                <StatusPill
                  label={team.status}
                  tone={team.status === 'Active' ? 'success' : team.status === 'Preseason' ? 'warning' : 'default'}
                />
              </button>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard style={styles.detailCard}>
          <h2 style={styles.cardHeading}>Team Details</h2>
          {selectedTeam ? (
            <DetailList
              items={[
                { label: 'Team', value: selectedTeam.name },
                { label: 'Sport', value: selectedTeam.sport },
                { label: 'Age Group', value: selectedTeam.ageGroup },
                { label: 'Athletes', value: selectedTeam.athleteCount },
                { label: 'Assistant Coaches', value: selectedTeam.assistantCoaches },
                { label: 'Next Session', value: new Date(selectedTeam.nextSession).toLocaleString() },
              ]}
            />
          ) : (
            <p style={styles.emptyText}>No teams match the current filters.</p>
          )}
        </SurfaceCard>
      </div>
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
  controlsCard: {
    padding: 18,
  },
  controlsRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr auto',
    gap: 12,
  },
  input: {
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    padding: '10px 12px',
    color: theme.colors.textPrimary,
  },
  select: {
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    padding: '10px 12px',
    color: theme.colors.textPrimary,
  },
  notice: {
    margin: '10px 0 0',
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  listCard: {
    padding: 18,
  },
  detailCard: {
    padding: 18,
  },
  cardHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  teamList: {
    display: 'grid',
    gap: 10,
  },
  teamRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 12,
    background: theme.colors.background,
    padding: 12,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
    cursor: 'pointer',
  },
  teamRowActive: {
    border: `1px solid ${theme.colors.primary}`,
    background: theme.colors.infoSoft,
  },
  teamName: {
    color: theme.colors.textPrimary,
    fontWeight: 700,
  },
  teamMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  emptyText: {
    margin: 0,
    color: theme.colors.textMuted,
  },
};
