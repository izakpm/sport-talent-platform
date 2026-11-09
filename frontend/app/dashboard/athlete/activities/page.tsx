'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { fetchWithAuth } from '../../../lib/api';

type Activity = {
  id: string;
  sport_id?: string;
  sport?: string;
  activity_type?: string;
  activity_category?: string;
  title?: string;
  description?: string;
  start_date?: string;
  start_time?: string;
  location?: string;
  verified?: boolean;
};

type Sport = {
  id: string;
  name: string;
};

export default function DashboardActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const activityTypes = ['Training', 'Match', 'Practice', 'Strength', 'Recovery'];

  const [sport, setSport] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');

  const [sportFilter, setSportFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const loadSports = async () => {
      try {
        const res = await fetchWithAuth('/sports');
        if (!res?.ok) return;
        const data = (await res.json()) as Sport[] | { data: Sport[] };
        setSports(Array.isArray(data) ? data : data.data || []);
      } catch {
        // ignore load errors for sports dropdown
      }
    };

    loadSports();
  }, []);

  const handleCreate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id;

      // Ensure we have an athlete id (athlete record may be separate from user)
      let athleteId = null;
      if (userId) {
        const aRes = await fetchWithAuth(`/athletes/user/${userId}`);
        if (aRes?.ok) {
          const aData = await aRes.json();
          athleteId = aData?.id;
        }

        if (!athleteId) {
          // create athlete record
          const createRes = await fetchWithAuth('/athletes', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
          });
          if (createRes?.ok) {
            const created = await createRes.json();
            athleteId = created?.id;
          }
        }
      }

      const title = `${activityType}${description ? ` - ${description}` : ''}`;

      const payload = {
        athlete_id: athleteId,
        sport_id: sport || undefined,
        activity_type: activityType,
        title,
        description,
        start_date: startDate || undefined,
        location: location || undefined,
      };

      let res;
      if (editingActivity) {
        res = await fetchWithAuth(`/activities/${editingActivity.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth('/activities', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (res?.ok) {
        setShowModal(false);
        setEditingActivity(null);
        // reload activities
        const res2 = await fetchWithAuth(`/activities${athleteId ? `?athlete_id=${athleteId}` : ''}`);
        if (res2?.ok) {
          const data = (await res2.json()) as Activity[] | { data: Activity[] };
          setActivities(Array.isArray(data) ? data : data.data || []);
        }
      } else {
        alert('Failed to save activity');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating activity');
    }
  };

  useEffect(() => {
    const loadActivities = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userId = user?.id;

        // Prefer athlete.id (from athletes table) if present; fallback to user id
        let athleteId = userId;
        if (userId) {
          const aRes = await fetchWithAuth(`/athletes/user/${userId}`);
          if (aRes?.ok) {
            const aData = await aRes.json();
            athleteId = aData?.id || athleteId;
          }
        }

        const res = await fetchWithAuth(`/activities${athleteId ? `?athlete_id=${athleteId}` : ''}`);
        if (!res?.ok) return;
        const data = (await res.json()) as Activity[] | { data: Activity[] };
        setActivities(Array.isArray(data) ? data : data.data || []);
      } catch (e) {
        console.error('loadActivities error', e);
        setActivities([]);
      }
    };

    loadActivities();
  }, []);

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setSport(activity.sport_id || '');
    setActivityType(activity.activity_type || '');
    setDescription(activity.description || '');
    setLocation(activity.location || '');
    setStartDate(activity.start_date || '');
    setMenuOpenId(null);
    setShowModal(true);
  };

  const handleDeleteActivity = async (activity: Activity) => {
    if (!window.confirm(`Delete activity "${activity.title || activity.activity_type}"?`)) return;
    try {
      const res = await fetchWithAuth(`/activities/${activity.id}`, { method: 'DELETE' });
      if (res?.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== activity.id));
        setMenuOpenId(null);
      } else {
        alert('Failed to delete activity');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting activity');
    }
  };

  const filteredActivities = activities
    .filter((activity) => {
      const activityDate = activity.start_date ? new Date(activity.start_date) : null;
      const dateFrom = dateFromFilter ? new Date(dateFromFilter) : null;
      const dateTo = dateToFilter ? new Date(dateToFilter) : null;
      const typeText = activity.activity_category || activity.activity_type || '';
      const sportText = activity.sport || '';
      const locationText = activity.location || '';

      if (typeFilter && typeText.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      if (sportFilter && sportText.toLowerCase() !== sportFilter.toLowerCase()) {
        return false;
      }

      if (locationFilter && !locationText.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }

      if (verifiedFilter !== 'all') {
        const isVerified = Boolean(activity.verified);
        if (verifiedFilter === 'verified' && !isVerified) return false;
        if (verifiedFilter === 'unverified' && isVerified) return false;
      }

      if (dateFrom && activityDate && activityDate < dateFrom) {
        return false;
      }

      if (dateTo && activityDate && activityDate > dateTo) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
      if (sortBy === 'date_asc') return aDate - bDate;
      if (sortBy === 'date_desc') return bDate - aDate;
      return 0;
    });

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Athlete Activities</p>
          <h1 style={styles.heading}>Training & Game Log</h1>
          <p style={styles.description}>Review your recent activity entries and stay on top of your schedule.</p>
        </div>
        <div>
          <button style={styles.addButton} onClick={() => setShowModal(true)}>+ Add Activity</button>
        </div>
      </div>

      <section style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <label style={styles.filterLabel}>
            Date from
            <input
              style={styles.filterInput}
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            Date to
            <input
              style={styles.filterInput}
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            Sport
            <select
              style={styles.filterInput}
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
            >
              <option value="">All sports</option>
              {sports.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
          <label style={styles.filterLabel}>
            Type
            <select
              style={styles.filterInput}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label style={styles.filterLabel}>
            Location
            <input
              style={styles.filterInput}
              type="search"
              placeholder="Search location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
            />
          </label>
          <label style={styles.filterLabel}>
            Verified
            <select
              style={styles.filterInput}
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </label>
        </div>

        <div style={styles.filterFooter}>
          <div style={styles.resultText}>{filteredActivities.length} activities shown</div>
          <label style={styles.filterLabelInline}>
            Sort by
            <select
              style={styles.filterInput}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Date newest</option>
              <option value="date_asc">Date oldest</option>
            </select>
          </label>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.cardTitle}>Recent Activity</h2>

        {activities.length === 0 ? (
          <p style={styles.placeholder}>No activity records available yet.</p>
        ) : (
          <div style={styles.list}>
            {activities.map((activity) => {
              const sportText = activity.sport || '-';
              const typeText = activity.activity_category || activity.activity_type || '-';
              const dateText = activity.start_date || (activity.start_time ? new Date(activity.start_time).toLocaleDateString() : '-');
              const titleText = activity.title || typeText;
              const activityDescription = activity.description || '';
              const locationText = activity.location || '-';

              return (
                <div key={activity.id} style={styles.activityCard}>
                  <div style={styles.activityHeader}>
                    <div style={styles.activityHeaderLeft}>
                      <h3 style={styles.activityTitle}>{titleText}</h3>
                      {activityDescription ? (
                        <p style={styles.activityDescription}>{activityDescription}</p>
                      ) : null}
                    </div>

                    <div style={styles.headerActions}>
                      <span style={{
                        ...styles.verifiedBadge,
                        background: activity.verified ? theme.colors.success : theme.colors.error,
                        color: theme.colors.white,
                      }}>
                        Verified
                      </span>

                      <div style={styles.menuContainer}>
                        <button
                          style={styles.menuBtn}
                          onClick={() => setMenuOpenId(menuOpenId === activity.id ? null : activity.id)}
                        >
                          ⋮
                        </button>
                        {menuOpenId === activity.id && (
                          <div style={styles.menuPopup}>
                            <button style={styles.menuItem} onClick={() => handleEditActivity(activity)}>
                              Edit Activity
                            </button>
                            <button style={styles.menuItem} onClick={() => handleDeleteActivity(activity)}>
                              Delete Activity
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={styles.activityMeta}>
                    <div style={styles.metaChip}>
                      <span style={styles.metaLabel}>Date</span>
                      {dateText}
                    </div>
                    <div style={styles.metaChip}>
                      <span style={styles.metaLabel}>Type</span>
                      {typeText}
                    </div>
                    <div style={styles.metaChip}>
                      <span style={styles.metaLabel}>Sport</span>
                      {sportText}
                    </div>
                    <div style={styles.metaChip}>
                      <span style={styles.metaLabel}>Location</span>
                      {locationText}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {showModal && (
        <div style={styles.modalOverlay}>
              <div style={styles.modal}>
            <h3 style={{ marginTop: 0, color: theme.colors.textPrimary }}>Add Activity</h3>

            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ color: theme.colors.textPrimary }}>
                Sport
                <select style={styles.input} value={sport} onChange={(e) => setSport(e.target.value)}>
                  <option value="">Select sport</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label style={{ color: theme.colors.textPrimary }}>
                Activity Type
                <select style={styles.input} value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                  <option value="">Select type</option>
                  {activityTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>

              <label style={{ color: theme.colors.textPrimary }}>
                Start Date
                <input type="date" style={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </label>

              <label style={{ color: theme.colors.textPrimary }}>
                Location
                <input type="text" style={styles.input} value={location} onChange={(e) => setLocation(e.target.value)} />
              </label>

              <label style={{ color: theme.colors.textPrimary }}>
                Description
                <textarea style={styles.input} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={styles.cancelButton} onClick={() => setShowModal(false)}>Cancel</button>
                <button style={styles.saveButton} onClick={handleCreate}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
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
  addButton: {
    background: theme.colors.primary,
    color: theme.colors.white,
    borderRadius: 12,
    padding: '10px 14px',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    background: theme.colors.card,
    color: theme.colors.textPrimary,
    padding: 20,
    borderRadius: 12,
    width: 520,
  },
  input: {
    width: '100%',
    padding: 8,
    marginTop: 6,
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: theme.colors.inputBackground,
    color: theme.typography.body.color,
  },
  cancelButton: {
    background: '#f3f4f6',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  saveButton: {
    background: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
  },
  cardTitle: {
    margin: 0,
    marginBottom: 18,
    fontSize: 18,
    fontWeight: 700,
    color: theme.typography.subheading.color,
  },
  filterCard: {
    background: theme.colors.card,
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  },
  filterLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  filterLabelInline: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  filterInput: {
    width: '100%',
    padding: 10,
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.typography.body.color,
    fontSize: 14,
  },
  filterFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  resultText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  list: {
    display: 'grid',
    gap: 16,
  },
  activityCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    padding: 22,
    borderRadius: 24,
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.06)',
  },
  activityDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 18,
    flexWrap: 'wrap',
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    padding: '0 16px',
    height: 34,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  activityTitle: {
    margin: 0,
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  activityDescription: {
    margin: 0,
    fontSize: 14,
    color: theme.colors.textMuted,
    maxWidth: 740,
    lineHeight: 1.6,
  },
  activityMeta: {
    display: 'flex',
    gap: 14,
    flexWrap: 'wrap',
  },
  activityHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },

  headerActions: {
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
    flex: 'none',
  },
  metaChip: {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: 4,
    borderRadius: 14,
    background: theme.colors.grey[100],
    padding: '12px 16px',
    minWidth: 120,
    color: theme.colors.textPrimary,
  },
  metaLabel: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  placeholder: {
    color: theme.colors.textMuted,
    fontSize: 15,
  },
  menuContainer: {
    position: 'relative',
    marginLeft: 8,
  },

  menuBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    color: theme.colors.textMuted,
  },

  menuPopup: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.spacing.borderRadius,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
    zIndex: 100,
    minWidth: 160,
  },

  menuItem: {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
};
