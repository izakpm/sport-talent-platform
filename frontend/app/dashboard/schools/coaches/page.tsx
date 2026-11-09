'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { ActionButton, DetailList, MetricCard, StatusPill, SurfaceCard } from '../../components/primitives';
import { SCHOOL_COACHES, SCHOOL_TEAMS, type SchoolCoach } from '../mock-data';

type CoachRecord = SchoolCoach & {
  primaryTeam: string;
};

export default function SchoolCoachesPage() {
  const [coaches, setCoaches] = useState<CoachRecord[]>(
    SCHOOL_COACHES.map((coach) => ({
      ...coach,
      primaryTeam:
        SCHOOL_TEAMS.find((team) => team.coach === coach.name || team.sport === coach.sport)?.name ||
        'Unassigned',
    })),
  );
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'On Leave'>('All');
  const [sportFilter, setSportFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState(SCHOOL_COACHES[0]?.id ?? '');
  const [activeMenuCoachId, setActiveMenuCoachId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingCoachId, setEditingCoachId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newCoach, setNewCoach] = useState({
    name: '',
    role: 'Assistant Coach' as SchoolCoach['role'],
    sport: SCHOOL_TEAMS[0]?.sport || 'Rugby',
    primaryTeam: SCHOOL_TEAMS[0]?.name || 'Unassigned',
    status: 'Active' as SchoolCoach['status'],
  });

  const visibleCoaches = useMemo(() => {
    return coaches.filter((coach) => {
      const matchesStatus = statusFilter === 'All' || coach.status === statusFilter;
      const matchesSport = sportFilter === 'All' || coach.sport === sportFilter;
      const q = query.toLowerCase();
      const matchesQuery =
        coach.name.toLowerCase().includes(q) ||
        coach.role.toLowerCase().includes(q) ||
        coach.sport.toLowerCase().includes(q);
      return matchesStatus && matchesSport && matchesQuery;
    });
  }, [coaches, query, statusFilter, sportFilter]);

  const activeCount = coaches.filter((coach) => coach.status === 'Active').length;
  const selectedCoach =
    visibleCoaches.find((coach) => coach.id === selectedCoachId) ?? visibleCoaches[0] ?? null;

  const teamOptions = Array.from(new Set(SCHOOL_TEAMS.map((team) => team.name)));
  const sportOptions = Array.from(new Set(SCHOOL_TEAMS.map((team) => team.sport)));

  const toggleLeave = (id: string) => {
    setCoaches((current) =>
      current.map((coach) =>
        coach.id === id
          ? { ...coach, status: coach.status === 'Active' ? 'On Leave' : 'Active' }
          : coach,
      ),
    );
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingCoachId(null);
    setFormError(null);
    setNewCoach({
      name: '',
      role: 'Assistant Coach',
      sport: sportOptions[0] || 'Rugby',
      primaryTeam: teamOptions[0] || 'Unassigned',
      status: 'Active',
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormError(null);
  };

  const openEditModal = (coach: CoachRecord) => {
    setModalMode('edit');
    setEditingCoachId(coach.id);
    setFormError(null);
    setNewCoach({
      name: coach.name,
      role: coach.role,
      sport: coach.sport,
      primaryTeam: coach.primaryTeam,
      status: coach.status,
    });
    setShowAddModal(true);
    setActiveMenuCoachId(null);
  };

  const deleteCoach = (id: string) => {
    setCoaches((current) => {
      const next = current.filter((coach) => coach.id !== id);
      if (selectedCoachId === id) {
        setSelectedCoachId(next[0]?.id ?? '');
      }
      return next;
    });
    setActiveMenuCoachId(null);
  };

  const saveCoach = () => {
    if (!newCoach.name.trim()) {
      setFormError('Coach name is required.');
      return;
    }

    if (modalMode === 'edit' && editingCoachId) {
      setCoaches((current) =>
        current.map((coach) =>
          coach.id === editingCoachId
            ? {
                ...coach,
                name: newCoach.name.trim(),
                role: newCoach.role,
                sport: newCoach.sport,
                status: newCoach.status,
                primaryTeam: newCoach.primaryTeam,
                assignedTeams: newCoach.primaryTeam === 'Unassigned' ? 0 : 1,
              }
            : coach,
        ),
      );
      closeAddModal();
      return;
    }

    const created: CoachRecord = {
      id: `school-coach-${Date.now()}`,
      name: newCoach.name.trim(),
      role: newCoach.role,
      sport: newCoach.sport,
      status: newCoach.status,
      assignedTeams: newCoach.primaryTeam === 'Unassigned' ? 0 : 1,
      primaryTeam: newCoach.primaryTeam,
    };

    setCoaches((current) => [created, ...current]);
    setSelectedCoachId(created.id);
    closeAddModal();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.kicker}>School</p>
        <h1 style={styles.heading}>Coaches</h1>
        <p style={styles.description}>Manage and view coaches attached to your school.</p>
      </div>

      <div style={styles.metricsGrid}>
        <MetricCard label="Total coaches" value={coaches.length} />
        <MetricCard label="Active" value={activeCount} />
        <MetricCard label="Visible" value={visibleCoaches.length} />
      </div>

      <SurfaceCard style={styles.filtersCard}>
        <div style={styles.filtersRow}>
          <input
            style={styles.input}
            placeholder="Search coach, role, or sport"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            style={styles.input}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as 'All' | 'Active' | 'On Leave')}
          >
            <option value="All">All statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
          </select>
          <select
            style={styles.input}
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
          >
            <option value="All">All sports</option>
            {sportOptions.map((sport) => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
          <ActionButton label="Add Coach" onClick={openAddModal} />
        </div>
      </SurfaceCard>

      <div style={styles.contentGrid}>
        <section style={styles.card}>
          {visibleCoaches.map((c) => (
            <div
              key={c.id}
              style={{ ...styles.row, ...(selectedCoach?.id === c.id ? styles.rowActive : {}) }}
              onClick={() => {
                setSelectedCoachId(c.id);
                setActiveMenuCoachId(null);
              }}
            >
              <button type="button" style={styles.rowMain} onClick={() => setSelectedCoachId(c.id)}>
                <div>
                  <div style={styles.name}>{c.name}</div>
                  <div style={styles.role}>{c.role} • {c.sport}</div>
                </div>
              </button>
              <div style={styles.rowActions}>
                <StatusPill label={c.status} tone={c.status === 'Active' ? 'success' : 'warning'} />
                <button
                  type="button"
                  aria-label={`Coach actions for ${c.name}`}
                  style={styles.menuTrigger}
                  onClick={(event) => {
                    event.stopPropagation();
                    setActiveMenuCoachId((current) => (current === c.id ? null : c.id));
                  }}
                >
                  ⋮
                </button>
                {activeMenuCoachId === c.id ? (
                  <div style={styles.menu}>
                    <button
                      type="button"
                      style={styles.menuItem}
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(c);
                      }}
                    >
                      Edit Coach
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.menuItem, ...styles.menuDelete }}
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteCoach(c.id);
                      }}
                    >
                      Delete Coach
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {!visibleCoaches.length ? <p style={styles.empty}>No coaches match the current filters.</p> : null}
        </section>

        <SurfaceCard style={styles.detailsCard}>
          <h2 style={styles.detailsHeading}>Coach Details</h2>
          {selectedCoach ? (
            <>
              <DetailList
                items={[
                  { label: 'Coach', value: selectedCoach.name },
                  { label: 'Role', value: selectedCoach.role },
                  { label: 'Sport', value: selectedCoach.sport },
                  { label: 'Primary Team', value: selectedCoach.primaryTeam },
                  { label: 'Assigned Teams', value: selectedCoach.assignedTeams },
                  { label: 'Status', value: selectedCoach.status },
                ]}
              />
              <div style={styles.detailsActions}>
                <ActionButton
                  label={selectedCoach.status === 'Active' ? 'Set Leave' : 'Activate'}
                  tone="neutral"
                  onClick={() => toggleLeave(selectedCoach.id)}
                />
              </div>
            </>
          ) : (
            <p style={styles.empty}>Select a coach to view details.</p>
          )}
        </SurfaceCard>
      </div>

      {showAddModal ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalHeading}>{modalMode === 'edit' ? 'Edit Coach' : 'Add Coach'}</h2>
            <div style={styles.modalGrid}>
              <label style={styles.label}>
                Coach Name
                <input
                  style={styles.input}
                  value={newCoach.name}
                  onChange={(event) => setNewCoach((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Enter coach name"
                />
              </label>

              <label style={styles.label}>
                Role
                <select
                  style={styles.input}
                  value={newCoach.role}
                  onChange={(event) =>
                    setNewCoach((current) => ({
                      ...current,
                      role: event.target.value as SchoolCoach['role'],
                    }))
                  }
                >
                  <option value="Head Coach">Head Coach</option>
                  <option value="Assistant Coach">Assistant Coach</option>
                  <option value="Specialist Coach">Specialist Coach</option>
                </select>
              </label>

              <label style={styles.label}>
                Sport
                <select
                  style={styles.input}
                  value={newCoach.sport}
                  onChange={(event) => setNewCoach((current) => ({ ...current, sport: event.target.value }))}
                >
                  {sportOptions.map((sport) => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                Team
                <select
                  style={styles.input}
                  value={newCoach.primaryTeam}
                  onChange={(event) =>
                    setNewCoach((current) => ({ ...current, primaryTeam: event.target.value }))
                  }
                >
                  {teamOptions.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </label>

              <label style={styles.label}>
                Status
                <select
                  style={styles.input}
                  value={newCoach.status}
                  onChange={(event) =>
                    setNewCoach((current) => ({
                      ...current,
                      status: event.target.value as SchoolCoach['status'],
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </label>
            </div>

            {formError ? <p style={styles.formError}>{formError}</p> : null}

            <div style={styles.modalActions}>
              <ActionButton label="Cancel" tone="neutral" onClick={closeAddModal} />
              <ActionButton label={modalMode === 'edit' ? 'Update Coach' : 'Save Coach'} onClick={saveCoach} />
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
  filtersCard: {
    padding: 14,
  },
  filtersRow: {
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
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 10,
    padding: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    background: '#f8fafc',
    textAlign: 'left',
    position: 'relative',
  },
  rowMain: {
    border: 'none',
    background: 'transparent',
    padding: 0,
    textAlign: 'left',
    cursor: 'pointer',
    flex: 1,
  },
  rowActive: {
    background: theme.colors.infoSoft,
    border: `1px solid ${theme.colors.primary}`,
  },
  name: { fontWeight: 700 },
  role: { color: theme.colors.textMuted, fontSize: 13 },
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
  detailsCard: { padding: 18 },
  detailsHeading: { margin: '0 0 12px', color: theme.colors.textPrimary, fontSize: 18 },
  detailsActions: { marginTop: 14, display: 'flex', justifyContent: 'flex-end' },
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
    maxWidth: 680,
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
