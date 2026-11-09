'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../../styles/theme';
import { fetchWithAuth } from '../../../lib/api';

interface Activity {
  id: string;
  date: string;
  type: 'practice' | 'gym' | 'match';
  title: string;
  time?: string;
  location?: string;
  sport?: string;
}

export default function DashboardCalendarPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

      // Get athlete record
      const athleteRes = await fetchWithAuth(`/athletes/user/${userData.id}`);
      if (!athleteRes?.ok) {
        setError('Failed to load athlete profile');
        return;
      }

      const athleteData = await athleteRes.json();
      if (!athleteData || !athleteData.id) {
        setError('No athlete profile found');
        return;
      }

      // For now, show placeholder activities
      // In a full implementation, you'd fetch from an activities endpoint
      const placeholderActivities: Activity[] = [
        {
          id: '1',
          date: '2026-05-26',
          type: 'practice',
          title: 'Rugby Practice',
          time: '10:00 AM - 12:00 PM',
          location: 'Training Ground',
          sport: 'Rugby',
        },
        {
          id: '2',
          date: '2026-05-26',
          type: 'gym',
          title: 'Strength Training',
          time: '2:00 PM - 3:30 PM',
          location: 'Gym Facility',
        },
        {
          id: '3',
          date: '2026-05-27',
          type: 'practice',
          title: 'Rugby Practice',
          time: '10:00 AM - 12:00 PM',
          location: 'Training Ground',
          sport: 'Rugby',
        },
        {
          id: '4',
          date: '2026-05-28',
          type: 'match',
          title: 'Rugby Match vs South Africa U20',
          time: '3:00 PM',
          location: 'Stadium',
          sport: 'Rugby',
        },
        {
          id: '5',
          date: '2026-05-29',
          type: 'gym',
          title: 'Recovery Session',
          time: '11:00 AM - 12:30 PM',
          location: 'Gym Facility',
        },
      ];

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
    return activities.filter(activity => activity.date === date);
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

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayActivities = getActivitiesForDate(dateStr);

      days.push(
        <div key={i} style={styles.calendarDay}>
          <div style={styles.dayNumber}>{i}</div>
          <div style={styles.dayActivities}>
            {dayActivities.map((activity, idx) => (
              <div
                key={`${activity.id}-${idx}`}
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
              </div>
            ))}
          </div>
        </div>
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
      {/* Header */}
      <div style={styles.headerSection}>
        <div>
          <p style={styles.kicker}>Schedule</p>
          <h1 style={styles.heading}>Calendar</h1>
          <p style={styles.subtitle}>
            View your upcoming practice sessions, gym sessions, and matches.
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.centerContent}>
          <p style={styles.loadingText}>Loading your calendar...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={loadCalendarData}>
            Try Again
          </button>
        </div>
      )}

      {/* Calendar View */}
      {!loading && !error && (
        <div style={styles.calendarContainer}>
          {/* Calendar Grid */}
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={styles.weekdayLabel}>
                  {day}
                </div>
              ))}
            </div>

            <div style={styles.calendarGrid}>{renderCalendar()}</div>
          </div>

          {/* Legend */}
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
              <span>Gym Session</span>
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

            {/* Upcoming Events */}
            <h3 style={styles.upcomingTitle}>Upcoming Events</h3>
            <div style={styles.upcomingList}>
              {activities
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map(activity => (
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

  dayNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginBottom: '4px',
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
};
