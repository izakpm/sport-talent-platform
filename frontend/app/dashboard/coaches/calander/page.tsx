'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../../styles/theme';
import { fetchWithAuth } from '../../../lib/api';
import { COACH_EVENTS } from '../mock-data';

interface Activity {
  id: string;
  date: string;
  type: 'practice' | 'gym' | 'match';
  title: string;
  time?: string;
  location?: string;
  team?: string;
}

export default function CoachCalanderPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState({
    type: 'practice' as Activity['type'],
    title: '',
    team: '',
    time: '',
    location: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    loadCalendarData();
  }, [router]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      const userData = JSON.parse(storedUser);
      if (!userData?.id) {
        setError('No coach profile found');
        return;
      }

      const coachRes = await fetchWithAuth('/activities');
      if (!coachRes) {
        setError('Failed to load coach profile');
        return;
      }

      const placeholderActivities: Activity[] = COACH_EVENTS.map((event) => ({
        id: event.id,
        date: event.date.split('T')[0],
        type: event.kind === 'Match' ? 'match' : event.kind === 'Review' ? 'gym' : 'practice',
        title: event.title,
        time: new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: event.location,
        team: event.team,
      }));

      setActivities(placeholderActivities);
    } catch (err) {
      console.error('Error loading calendar:', err);
      setError('An error occurred while loading calendar');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivitiesForDate = (date: string) => {
    return activities.filter((activity) => activity.date === date);
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'practice':
        return { bg: '#e3f2fd', border: '#1976d2', text: '#1565c0' };
      case 'gym':
        return { bg: '#f3e5f5', border: '#7b1fa2', text: '#6a1b9a' };
      case 'match':
        return { bg: '#fff3e0', border: '#f57c00', text: '#e65100' };
      default:
        return { bg: '#f5f5f5', border: '#999', text: '#666' };
    }
  };

  const availableTeams = Array.from(
    new Set(COACH_EVENTS.map((event) => event.team).filter(Boolean)),
  );

  const toTimeInputValue = (value?: string) => {
    if (!value) return '';
    if (/^\d{2}:\d{2}$/.test(value)) return value;

    const parsed = new Date(`1970-01-01 ${value}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
    }

    return '';
  };

  const openAddModal = (date: string) => {
    setSelectedDate(date);
    setEditingActivityId(null);
    setFormError(null);
    setNewActivity({
      type: 'practice',
      title: '',
      team: availableTeams[0] || 'General Coaching',
      time: '',
      location: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (activity: Activity, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedDate(activity.date);
    setEditingActivityId(activity.id);
    setFormError(null);
    setNewActivity({
      type: activity.type,
      title: activity.title,
      team: activity.team || availableTeams[0] || 'General Coaching',
      time: toTimeInputValue(activity.time),
      location: activity.location || '',
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedDate(null);
    setEditingActivityId(null);
    setFormError(null);
  };

  const saveActivity = () => {
    if (!selectedDate) {
      setFormError('No date selected for this activity.');
      return;
    }

    if (!newActivity.title.trim() || !newActivity.time.trim() || !newActivity.team.trim()) {
      setFormError('Please complete title, team, and time before saving.');
      return;
    }

    if (editingActivityId) {
      setActivities((current) =>
        current.map((activity) =>
          activity.id === editingActivityId
            ? {
                ...activity,
                date: selectedDate,
                type: newActivity.type,
                title: newActivity.title.trim(),
                time: newActivity.time,
                location: newActivity.location.trim(),
                team: newActivity.team,
              }
            : activity,
        ),
      );
    } else {
      const created: Activity = {
        id: `coach-activity-${Date.now()}`,
        date: selectedDate,
        type: newActivity.type,
        title: newActivity.title.trim(),
        time: newActivity.time,
        location: newActivity.location.trim(),
        team: newActivity.team,
      };

      setActivities((current) => [...current, created]);
    }

    closeAddModal();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayActivities = getActivitiesForDate(dateStr);

      days.push(
        <div
          key={i}
          style={styles.calendarDayButton}
          onClick={() => openAddModal(dateStr)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openAddModal(dateStr);
            }
          }}
          aria-label={`Open add activity for day ${i}`}
        >
          <div style={styles.calendarDay}>
          <div style={styles.dayNumber}>{i}</div>
          <div style={styles.dayAddHint}>+ Add</div>
          <div style={styles.dayActivities}>
            {dayActivities.map((activity, idx) => (
              <button
                key={`${activity.id}-${idx}`}
                type="button"
                onClick={(event) => openEditModal(activity, event)}
                style={{
                  ...styles.dayActivity,
                  backgroundColor: getActivityColor(activity.type).bg,
                  borderLeft: `3px solid ${getActivityColor(activity.type).border}`,
                }}
              >
                <p style={{ ...styles.dayActivityText, color: getActivityColor(activity.type).text }}>
                  {activity.title.length > 20
                    ? activity.title.substring(0, 20) + '...'
                    : activity.title}
                </p>
              </button>
            ))}
          </div>
          </div>
        </div>,
      );
    }

    return days;
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  return (
    <div style={styles.page}>
      <div style={styles.headerSection}>
        <div>
          <p style={styles.kicker}>Schedule</p>
          <h1 style={styles.heading}>Calendar</h1>
          <p style={styles.subtitle}>
            View your upcoming coach sessions, reviews, and matches.
          </p>
        </div>
      </div>

      {loading && (
        <div style={styles.centerContent}>
          <p style={styles.loadingText}>Loading your calendar...</p>
        </div>
      )}

      {error && !loading && (
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={loadCalendarData}>
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={styles.calendarContainer}>
          <div style={styles.calendarSection}>
            <div style={styles.monthHeader}>
              <button style={styles.navBtn} onClick={previousMonth}>
                ← Previous
              </button>
              <h2 style={styles.monthName}>{monthName}</h2>
              <button style={styles.navBtn} onClick={nextMonth}>
                Next →
              </button>
            </div>

            <div style={styles.weekdaysHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} style={styles.weekdayLabel}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>{renderCalendar()}</div>
          </div>

          <div style={styles.legendSection}>
            <h3 style={styles.legendTitle}>Activity Types</h3>
            <div style={styles.legendItem}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#1976d2',
                  borderRadius: '2px',
                }}
              />
              <span>Practice Session</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#7b1fa2',
                  borderRadius: '2px',
                }}
              />
              <span>Review Session</span>
            </div>
            <div style={styles.legendItem}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#f57c00',
                  borderRadius: '2px',
                }}
              />
              <span>Match</span>
            </div>

            <h3 style={styles.upcomingTitle}>Upcoming Events</h3>
            <div style={styles.upcomingList}>
              {activities
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((activity) => (
                  <div key={activity.id} style={styles.upcomingItem}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: getActivityColor(activity.type).border,
                        borderRadius: '50%',
                      }}
                    />
                    <div style={styles.upcomingInfo}>
                      <p style={styles.upcomingTitle2}>{activity.title}</p>
                      <p style={styles.upcomingDate}>{formatDate(activity.date)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {showAddModal && selectedDate && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <h3 style={styles.modalTitle}>{editingActivityId ? 'Edit Activity' : 'Add Activity'}</h3>
            <p style={styles.modalDate}>Date: {formatDate(selectedDate)}</p>

            <div style={styles.formGrid}>
              <label style={styles.fieldLabel}>
                Activity Type
                <select
                  style={styles.fieldInput}
                  value={newActivity.type}
                  onChange={(event) =>
                    setNewActivity((current) => ({
                      ...current,
                      type: event.target.value as Activity['type'],
                    }))
                  }
                >
                  <option value="practice">Practice</option>
                  <option value="gym">Review/Gym</option>
                  <option value="match">Match</option>
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Team
                <select
                  style={styles.fieldInput}
                  value={newActivity.team}
                  onChange={(event) =>
                    setNewActivity((current) => ({ ...current, team: event.target.value }))
                  }
                >
                  {availableTeams.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                  <option value="General Coaching">General Coaching</option>
                </select>
              </label>

              <label style={styles.fieldLabel}>
                Time
                <input
                  type="time"
                  style={styles.fieldInput}
                  value={newActivity.time}
                  onChange={(event) =>
                    setNewActivity((current) => ({ ...current, time: event.target.value }))
                  }
                />
              </label>

              <label style={styles.fieldLabel}>
                Title
                <input
                  type="text"
                  style={styles.fieldInput}
                  placeholder="Enter activity title"
                  value={newActivity.title}
                  onChange={(event) =>
                    setNewActivity((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>

              <label style={styles.fieldLabel}>
                Location
                <input
                  type="text"
                  style={styles.fieldInput}
                  placeholder="Optional location"
                  value={newActivity.location}
                  onChange={(event) =>
                    setNewActivity((current) => ({ ...current, location: event.target.value }))
                  }
                />
              </label>
            </div>

            {formError ? <p style={styles.formError}>{formError}</p> : null}

            <div style={styles.modalActions}>
              <button type="button" style={styles.modalCancelBtn} onClick={closeAddModal}>
                Cancel
              </button>
              <button type="button" style={styles.modalSaveBtn} onClick={saveActivity}>
                {editingActivityId ? 'Update Activity' : 'Save Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: theme.colors.background,
    padding: '40px 20px',
  } as CSSProperties,

  headerSection: {
    marginBottom: '40px',
  } as CSSProperties,

  kicker: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    margin: '0 0 8px 0',
  } as CSSProperties,

  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    margin: '0 0 12px 0',
  } as CSSProperties,

  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    margin: 0,
    maxWidth: '600px',
  } as CSSProperties,

  centerContent: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
  } as CSSProperties,

  loadingText: {
    fontSize: 16,
    color: theme.colors.textMuted,
    margin: 0,
  } as CSSProperties,

  errorCard: {
    maxWidth: '1200px',
    padding: '24px',
    backgroundColor: '#fef2f2',
    border: `1px solid ${theme.colors.error}`,
    borderRadius: theme.spacing.borderRadius,
    textAlign: 'center',
  } as CSSProperties,

  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    margin: '0 0 16px 0',
  } as CSSProperties,

  retryBtn: {
    padding: '10px 20px',
    backgroundColor: theme.colors.error,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.spacing.borderRadius,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  calendarContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: '32px',
  } as CSSProperties,

  calendarSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.colors.border}`,
  } as CSSProperties,

  monthHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${theme.colors.border}`,
  } as CSSProperties,

  navBtn: {
    padding: '8px 16px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
  } as CSSProperties,

  monthName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    margin: 0,
  } as CSSProperties,

  weekdaysHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  } as CSSProperties,

  weekdayLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    padding: '8px',
    textTransform: 'uppercase',
  } as CSSProperties,

  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
  } as CSSProperties,

  calendarDay: {
    minHeight: '120px',
    padding: '8px',
    backgroundColor: 'rgba(31, 111, 139, 0.02)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties,

  calendarDayButton: {
    padding: 0,
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    borderRadius: '6px',
  } as CSSProperties,

  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginBottom: '4px',
  } as CSSProperties,

  dayAddHint: {
    fontSize: 10,
    color: theme.colors.primary,
    marginBottom: '4px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  } as CSSProperties,

  dayActivities: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflow: 'hidden',
  } as CSSProperties,

  dayActivity: {
    padding: '4px 6px',
    borderRadius: '3px',
    fontSize: 11,
    overflow: 'hidden',
    width: '100%',
    borderTop: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    textAlign: 'left',
    cursor: 'pointer',
  } as CSSProperties,

  dayActivityText: {
    margin: 0,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  } as CSSProperties,

  legendSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.colors.border}`,
    height: 'fit-content',
  } as CSSProperties,

  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    margin: '0 0 16px 0',
  } as CSSProperties,

  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginBottom: '12px',
  } as CSSProperties,

  upcomingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    margin: '20px 0 16px 0',
    paddingTop: '20px',
    borderTop: `1px solid ${theme.colors.border}`,
  } as CSSProperties,

  upcomingTitle2: {
    fontSize: 13,
    fontWeight: 600,
    color: theme.colors.textPrimary,
    margin: 0,
  } as CSSProperties,

  upcomingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as CSSProperties,

  upcomingItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'rgba(31, 111, 139, 0.03)',
    borderRadius: '6px',
  } as CSSProperties,

  upcomingInfo: {
    flex: 1,
  } as CSSProperties,

  upcomingDate: {
    fontSize: 11,
    color: theme.colors.textMuted,
    margin: 0,
  } as CSSProperties,

  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  } as CSSProperties,

  modalCard: {
    width: '100%',
    maxWidth: '620px',
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.2)',
    padding: '20px',
  } as CSSProperties,

  modalTitle: {
    margin: 0,
    color: theme.colors.textPrimary,
    fontSize: 22,
  } as CSSProperties,

  modalDate: {
    margin: '6px 0 0',
    color: theme.colors.textMuted,
    fontSize: 14,
  } as CSSProperties,

  formGrid: {
    marginTop: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  } as CSSProperties,

  fieldLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: 600,
  } as CSSProperties,

  fieldInput: {
    borderRadius: '8px',
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    padding: '10px 12px',
    fontSize: 14,
  } as CSSProperties,

  formError: {
    margin: '12px 0 0',
    color: theme.colors.error,
    fontSize: 13,
    fontWeight: 600,
  } as CSSProperties,

  modalActions: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  } as CSSProperties,

  modalCancelBtn: {
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 600,
  } as CSSProperties,

  modalSaveBtn: {
    border: 'none',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    borderRadius: '8px',
    padding: '10px 14px',
    cursor: 'pointer',
    fontWeight: 700,
  } as CSSProperties,
};
