'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../../styles/theme';
import { fetchWithAuth } from '../../lib/api';

type Activity = {
  id: string;
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
  const [showModal, setShowModal] = useState(false);
  const [sports, setSports] = useState<Sport[]>([]);
  const activityTypes = ['Training', 'Match', 'Practice', 'Strength', 'Recovery'];

  const [sport, setSport] = useState('');
  const [activityType, setActivityType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');

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

      const res = await fetchWithAuth('/activities', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.ok) {
        setShowModal(false);
        // reload activities
        const res2 = await fetchWithAuth(`/activities${athleteId ? `?athlete_id=${athleteId}` : ''}`);
        if (res2?.ok) {
          const data = (await res2.json()) as Activity[] | { data: Activity[] };
          setActivities(Array.isArray(data) ? data : data.data || []);
        }
      } else {
        alert('Failed to create activity');
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
                    <div>
                      <h3 style={styles.activityTitle}>{titleText}</h3>
                      {activityDescription ? (
                        <p style={styles.activityDescription}>{activityDescription}</p>
                      ) : null}
                    </div>

                    <span style={{
                      ...styles.verifiedBadge,
                      background: activity.verified ? theme.colors.success : theme.colors.error,
                      color: theme.colors.white,
                    }}>
                      Verified
                    </span>
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
    background: '#ffffff',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    boxShadow: '0 18px 35px rgba(15, 23, 42, 0.08)',
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
};
