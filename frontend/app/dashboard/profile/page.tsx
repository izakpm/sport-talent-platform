'use client';

import { ChangeEvent, useEffect, useState, type CSSProperties } from 'react';
import { theme } from '../../styles/theme';
import { fetchWithAuth } from '../../lib/api';
import { getDashboardRoleConfig, normalizeDashboardRole } from '../core/roles';
import { ActionButton, DetailList, MetricCard, StatusPill, SurfaceCard } from '../components/primitives';

type UserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  status?: string;
  created_at?: string;
  profile_image?: string;
};

type AthleteProfile = {
  nationality?: string;
  province?: string;
  school_id?: string;
  guardian_id?: string;
  profile_visibility?: string;
};

export default function DashboardProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed: UserProfile = JSON.parse(storedUser);
      setUser(parsed);
      loadAthlete(parsed.id);
      loadUser(parsed.id);
    }
  }, []);

  const loadAthlete = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/athletes/user/${userId}`);
      if (!res?.ok) return;
      const data = await res.json();
      setAthlete(data);
    } catch {
      setAthlete(null);
    }
  };

  const loadUser = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}`);
      if (!res?.ok) return;
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaveMessage(null);
    setSaveError(null);

    // Base64 adds roughly one third to the upload size; leave room for JSON.
    if (file.size > 3 * 1024 * 1024) {
      setSelectedImage(null);
      setSaveError('Please choose a profile image smaller than 3 MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = async () => {
    if (!user || !selectedImage) return;

    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);
    try {
      const res = await fetchWithAuth(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ profile_image: selectedImage }),
      });

      if (!res) {
        setSaveError('Unable to reach the server. Please try again.');
        return;
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        if (res.status === 413) {
          setSaveError('Image is too large. Please choose a smaller image.');
        } else {
          setSaveError(`Failed to save photo (status ${res.status}). ${errorText}`.trim());
        }
        return;
      }

      const updated = await res.json();
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setSelectedImage(null);
      setSaveMessage('Photo saved successfully.');
    } catch {
      setSaveError('Unexpected error while saving photo. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const fullName = user ? `${user.first_name || 'Athlete'} ${user.last_name || ''}`.trim() : 'Athlete';
  const normalizedRole = normalizeDashboardRole(user?.role);
  const roleLabel = getDashboardRoleConfig(normalizedRole).roleLabel;
  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const isVerified = user?.status === 'VERIFIED';
  const createdDate = user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>{roleLabel} Profile</p>
          <h1 style={styles.heading}>My Profile</h1>
          <p style={styles.description}>
            Manage your {roleLabel.toLowerCase()} identity, details, and verification status from one place.
          </p>
        </div>
      </div>

      <section style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div style={styles.avatar}>
            {selectedImage || user?.profile_image ? (
              <img
                src={selectedImage || user?.profile_image || ''}
                alt="Profile photo"
                style={styles.avatarImage}
              />
            ) : (
              initials || 'A'
            )}
          </div>
          <div style={styles.heroInfo}>
            <div style={styles.heroLabel}>Profile Overview</div>
            <h2 style={styles.heroName}>{fullName}</h2>
            <p style={styles.heroMeta}>{user?.role || roleLabel}</p>
            <div style={styles.badgeRow}>
              <StatusPill
                label={isVerified ? `Verified ${roleLabel}` : 'Pending Verification'}
                tone={isVerified ? 'success' : 'error'}
              />
              <StatusPill label={athlete?.profile_visibility || 'Private Profile'} tone="warning" />
            </div>
          </div>
          <div style={styles.heroActions}>
            <label style={styles.uploadLabel}>
              <input type="file" accept="image/*" style={styles.fileInput} onChange={handlePhotoChange} />
              Change Photo
            </label>
            {selectedImage ? (
              <ActionButton
                label={isSaving ? 'Saving…' : 'Save Photo'}
                onClick={savePhoto}
                disabled={isSaving}
                tone="success"
              />
            ) : null}
            {saveMessage ? <div style={styles.saveMessage}>{saveMessage}</div> : null}
            {saveError ? <div style={styles.saveError}>{saveError}</div> : null}
          </div>
        </div>

        <div style={styles.heroStats}>
          <MetricCard label="Training Sessions" value="12" style={styles.statCard} />
          <MetricCard label="Verified Achievements" value="5" style={styles.statCard} />
          <MetricCard label="Preferred Positions" value="3" style={styles.statCard} />
        </div>
      </section>

      <div style={styles.grid}>
        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardTitle}>Personal Information</h3>
          <DetailList
            items={[
              { label: 'Full Name', value: fullName },
              { label: 'Email', value: user?.email || 'Not available' },
              { label: 'Member Since', value: createdDate },
              { label: 'Guardian', value: athlete?.guardian_id || 'Not added' },
            ]}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <h3 style={styles.cardTitle}>{roleLabel} Details</h3>
          <DetailList
            items={[
              { label: 'Nationality', value: athlete?.nationality || 'TBD' },
              { label: 'Province', value: athlete?.province || 'TBD' },
              { label: 'School', value: athlete?.school_id || 'Not set' },
              { label: 'Profile Visibility', value: athlete?.profile_visibility || 'Private' },
            ]}
          />
        </SurfaceCard>
      </div>

      <SurfaceCard style={styles.cardFull}>
        <h3 style={styles.cardTitle}>About Me</h3>
        <p style={styles.value}>
          Keep your profile up to date with your latest highlights, goals, and achievements. A strong profile improves trust, collaboration, and discoverability on PlayVerified.
        </p>
      </SurfaceCard>
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
  heroCard: {
    borderRadius: 24,
    background: 'linear-gradient(135deg, rgba(31,111,139,0.95), rgba(15,23,42,0.95))',
    color: theme.colors.white,
    padding: 28,
    boxShadow: '0 24px 48px rgba(15, 23, 42, 0.18)',
  },
  heroTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: '50%',
    background: theme.colors.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 28,
    fontWeight: 700,
    color: theme.colors.white,
    boxShadow: '0 16px 28px rgba(0, 0, 0, 0.18)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  heroInfo: {
    flex: 1,
    minWidth: 220,
  },
  heroLabel: {
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 700,
  },
  heroName: {
    margin: 0,
    fontSize: 32,
    lineHeight: 1.1,
  },
  heroMeta: {
    margin: '10px 0 0',
    color: 'rgba(255,255,255,0.78)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 16,
  },
  statusBadge: {
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  smallBadge: {
    borderRadius: 999,
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.12)',
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    minWidth: 120,
    gap: 10,
    flexWrap: 'wrap',
  },
  uploadLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.16)',
    color: theme.colors.white,
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    border: '1px solid rgba(255,255,255,0.12)',
  },
  fileInput: {
    display: 'none',
  },
  saveButton: {
    borderRadius: 14,
    background: theme.colors.success,
    border: 'none',
    color: theme.colors.white,
    fontWeight: 700,
    padding: '10px 18px',
    cursor: 'pointer',
  },
  saveMessage: {
    width: '100%',
    color: '#d1fae5',
    fontSize: 13,
    fontWeight: 600,
  },
  saveError: {
    width: '100%',
    color: '#fecaca',
    fontSize: 13,
    fontWeight: 600,
  },
  editButton: {
    borderRadius: 14,
    background: theme.colors.primary,
    border: 'none',
    color: theme.colors.white,
    fontWeight: 700,
    padding: '10px 18px',
    cursor: 'pointer',
  },
  heroStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))',
    gap: 16,
    marginTop: 28,
  },
  statCard: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 18,
    minHeight: 100,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.78)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  card: {
    background: theme.colors.card,
    borderRadius: 22,
    padding: 24,
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
  },
  cardFull: {
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
    color: theme.colors.textPrimary,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '150px 1fr',
    gap: 12,
    marginBottom: 14,
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: 700,
  },
  value: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 1.6,
  },
};
