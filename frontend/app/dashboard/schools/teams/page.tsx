'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, DetailList, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { SCHOOL_COACHES, SCHOOL_TEAMS, type SchoolTeam } from '../mock-data';

export default function SchoolTeamsPage() {
  const [teams, setTeams] = useState(SCHOOL_TEAMS);
  const [sportFilter, setSportFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Season' | 'Preseason' | 'Offseason'>('All');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(SCHOOL_TEAMS[0]?.id ?? '');
  const [activeMenuTeamId, setActiveMenuTeamId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    division: 'Senior',
    sport: SCHOOL_TEAMS[0]?.sport || 'Rugby',
    athleteCount: 0,
    coach: SCHOOL_COACHES[0]?.name || 'Unassigned',
    status: 'In Season' as SchoolTeam['status'],
  });

  const sports = ['All', ...Array.from(new Set(teams.map((team) => team.sport)))];
  const coachOptions = Array.from(new Set(SCHOOL_COACHES.map((coach) => coach.name)));

  const visibleTeams = useMemo(() => {
    return teams.filter((team) => {
      const q = query.toLowerCase();
      const matchesQuery =
        team.name.toLowerCase().includes(q) ||
        team.sport.toLowerCase().includes(q) ||
        team.coach.toLowerCase().includes(q);
      return (
        (sportFilter === 'All' || team.sport === sportFilter) &&
        (statusFilter === 'All' || team.status === statusFilter) &&
        matchesQuery
      );
    });
  }, [sportFilter, statusFilter, query, teams]);

  const selectedTeam = visibleTeams.find((team) => team.id === selectedId) ?? visibleTeams[0] ?? null;
  const totalAthletes = visibleTeams.reduce((sum, team) => sum + team.athleteCount, 0);

  const openAddModal = () => {
    setModalMode('add');
    setEditingTeamId(null);
    setFormError(null);
    setTeamForm({
      name: '',
      division: 'Senior',
      sport: sports[1] || 'Rugby',
      athleteCount: 0,
      coach: coachOptions[0] || 'Unassigned',
      status: 'In Season',
    });
    setShowModal(true);
  };

  const openEditModal = (team: SchoolTeam) => {
    setModalMode('edit');
    setEditingTeamId(team.id);
    setFormError(null);
    setTeamForm({
      name: team.name,
      division: team.division,
      sport: team.sport,
      athleteCount: team.athleteCount,
      coach: team.coach,
      status: team.status,
    });
    setShowModal(true);
    setActiveMenuTeamId(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormError(null);
  };

  const deleteTeam = (id: string) => {
    setTeams((current) => {
      const next = current.filter((team) => team.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? '');
      }
      return next;
    });
    setActiveMenuTeamId(null);
  };

  const saveTeam = () => {
    if (!teamForm.name.trim()) {
      setFormError('Team name is required.');
      return;
    }

    if (modalMode === 'edit' && editingTeamId) {
      setTeams((current) =>
        current.map((team) =>
          team.id === editingTeamId
            ? {
                ...team,
                name: teamForm.name.trim(),
                division: teamForm.division,
                sport: teamForm.sport,
                athleteCount: Number(teamForm.athleteCount) || 0,
                coach: teamForm.coach,
                status: teamForm.status,
              }
            : team,
        ),
      );
      closeModal();
      return;
    }

    const created: SchoolTeam = {
      id: `school-team-${Date.now()}`,
      name: teamForm.name.trim(),
      division: teamForm.division,
      sport: teamForm.sport,
      athleteCount: Number(teamForm.athleteCount) || 0,
      coach: teamForm.coach,
      status: teamForm.status,
    };

    setTeams((current) => [created, ...current]);
    setSelectedId(created.id);
    closeModal();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.kicker}>School</p>
        <h1 style={styles.heading}>Teams</h1>
        <p style={styles.description}>Overview of registered teams at your school.</p>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label="Teams" value={visibleTeams.length} />
        <MetricCard label="Athletes" value={totalAthletes} />
        <MetricCard label="Sports" value={new Set(visibleTeams.map((team) => team.sport)).size} />
      </div>

      <SurfaceCard style={styles.filterCard}>
        <div style={styles.filterRow}>
          <input
            style={styles.input}
            placeholder="Search team, coach, or sport"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            style={styles.input}
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
          >
            {sports.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <select
            style={styles.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'All' | 'In Season' | 'Preseason' | 'Offseason')}
          >
            <option value="All">All statuses</option>
            <option value="In Season">In Season</option>
            <option value="Preseason">Preseason</option>
            <option value="Offseason">Offseason</option>
          </select>
          <ActionButton label="Add Team" onClick={openAddModal} />
        </div>
      </SurfaceCard>

      <div style={styles.contentGrid}>
        <section style={styles.card}>
          {visibleTeams.map((t) => (
            <div
              key={t.id}
              style={{ ...styles.row, ...(selectedTeam?.id === t.id ? styles.rowActive : {}) }}
              onClick={() => {
                setSelectedId(t.id);
                setActiveMenuTeamId(null);
              }}
            >
              <button type="button" style={styles.rowMain} onClick={() => setSelectedId(t.id)}>
                <div>
                  <div style={styles.name}>{t.name}</div>
                  <div style={styles.meta}>{t.sport} • {t.division}</div>
                </div>
              </button>
              <div style={styles.rowActions}>
                <StatusPill label={t.status} tone={t.status === 'In Season' ? 'success' : t.status === 'Preseason' ? 'warning' : 'default'} />
                <button
                  type="button"
                  style={styles.menuTrigger}
                  aria-label={`Team actions for ${t.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveMenuTeamId((current) => (current === t.id ? null : t.id));
                  }}
                >
                  ⋮
                </button>
                {activeMenuTeamId === t.id ? (
                  <div style={styles.menu}>
                    <button
                      type="button"
                      style={styles.menuItem}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(t);
                      }}
                    >
                      Edit Team
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.menuItem, ...styles.menuDelete }}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteTeam(t.id);
                      }}
                    >
                      Delete Team
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {!visibleTeams.length ? <p style={styles.empty}>No teams available for this sport.</p> : null}
        </section>

        <SurfaceCard style={styles.detailsCard}>
          <h2 style={styles.detailsHeading}>Team Details</h2>
          {selectedTeam ? (
            <DetailList
              items={[
                { label: 'Team', value: selectedTeam.name },
                { label: 'Division', value: selectedTeam.division },
                { label: 'Sport', value: selectedTeam.sport },
                { label: 'Athletes', value: selectedTeam.athleteCount },
                { label: 'Coach', value: selectedTeam.coach },
                { label: 'Status', value: selectedTeam.status },
              ]}
            />
          ) : (
            <p style={styles.empty}>Select a team to view details.</p>
          )}
        </SurfaceCard>
      </div>

      {showModal ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalHeading}>{modalMode === 'edit' ? 'Edit Team' : 'Add Team'}</h2>
            <div style={styles.modalGrid}>
              <label style={styles.label}>
                Team Name
                <input
                  style={styles.input}
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter team name"
                />
              </label>

              <label style={styles.label}>
                Division
                <input
                  style={styles.input}
                  value={teamForm.division}
                  onChange={(event) => setTeamForm((current) => ({ ...current, division: event.target.value }))}
                  placeholder="e.g. U16 / Senior"
                />
              </label>

              <label style={styles.label}>
                Sport
                <select
                  style={styles.input}
                  value={teamForm.sport}
                  onChange={(event) => setTeamForm((current) => ({ ...current, sport: event.target.value }))}
                >
                  {sports.filter((sport) => sport !== 'All').map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Coach
                <select
                  style={styles.input}
                  value={teamForm.coach}
                  onChange={(event) => setTeamForm((current) => ({ ...current, coach: event.target.value }))}
                >
                  {coachOptions.map((coach) => (
                    <option key={coach} value={coach}>{coach}</option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </label>

              <label style={styles.label}>
                Athletes
                <input
                  type="number"
                  min={0}
                  style={styles.input}
                  value={teamForm.athleteCount}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, athleteCount: Number(event.target.value) }))
                  }
                />
              </label>

              <label style={styles.label}>
                Status
                <select
                  style={styles.input}
                  value={teamForm.status}
                  onChange={(event) =>
                    setTeamForm((current) => ({ ...current, status: event.target.value as SchoolTeam['status'] }))
                  }
                >
                  <option value="In Season">In Season</option>
                  <option value="Preseason">Preseason</option>
                  <option value="Offseason">Offseason</option>
                </select>
              </label>
            </div>

            {formError ? <p style={styles.formError}>{formError}</p> : null}

            <div style={styles.modalActions}>
              <ActionButton label="Cancel" tone="neutral" onClick={closeModal} />
              <ActionButton label={modalMode === 'edit' ? 'Update Team' : 'Save Team'} onClick={saveTeam} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  header: { display: 'flex', flexDirection: 'column', gap: 8 },
  kicker: { color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase' },
  heading: { margin: 0, fontSize: 28, color: theme.colors.textPrimary },
  description: { marginTop: 6, color: theme.colors.textMuted },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  filterCard: { padding: 14 },
  filterRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr auto',
    gap: 10,
  },
  input: {
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    padding: '10px 12px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  card: { background: theme.colors.card, padding: 18, borderRadius: 12, display: 'grid', gap: 12, border: `1px solid ${theme.colors.border}` },
  row: {
    padding: 12,
    borderRadius: 10,
    background: '#f8fafc',
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
    position: 'relative',
    gap: 10,
  },
  rowMain: {
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    padding: 0,
    cursor: 'pointer',
    flex: 1,
  },
  rowActive: {
    background: theme.colors.infoSoft,
    border: `1px solid ${theme.colors.primary}`,
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  menuTrigger: {
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.card,
    borderRadius: 8,
    width: 32,
    height: 32,
    cursor: 'pointer',
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: '28px',
    padding: 0,
  },
  menu: {
    position: 'absolute',
    top: 36,
    right: 0,
    minWidth: 140,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.card,
    borderRadius: 10,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)',
    zIndex: 30,
    overflow: 'hidden',
  },
  menuItem: {
    width: '100%',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    padding: '10px 12px',
    cursor: 'pointer',
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  menuDelete: {
    color: theme.colors.error,
    borderTop: `1px solid ${theme.colors.border}`,
  },
  name: { fontWeight: 700 },
  meta: { color: theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  detailsCard: { padding: 18 },
  detailsHeading: { margin: '0 0 12px', color: theme.colors.textPrimary, fontSize: 18 },
  empty: { margin: 0, color: theme.colors.textMuted },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 14,
    padding: 20,
    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)',
  },
  modalHeading: {
    margin: '0 0 12px',
    color: theme.colors.textPrimary,
    fontSize: 22,
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: 600,
  },
  formError: {
    margin: '10px 0 0',
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: 600,
  },
  modalActions: {
    marginTop: 16,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
  },
};
