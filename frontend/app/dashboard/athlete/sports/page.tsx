'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '../../../styles/theme';
import { fetchWithAuth, API_URL } from '../../../lib/api';

interface Position {
  id: string;
  name: string;
  sport_id: string;
}

interface Sport {
  id: string;
  name: string;
  category?: string;
}

interface SportCard {
  sport: Sport;
  positions: Position[];
  isPrimary: boolean;
  athleteSportIds: string[];
}

interface AthleteData {
  id: string;
  user_id: string;
  [key: string]: any;
}

export default function DashboardSportsPage() {
  const router = useRouter();
  const [sportCards, setSportCards] = useState<SportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [athlete, setAthlete] = useState<AthleteData | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<SportCard | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const [formSportId, setFormSportId] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [formIsPrimary, setFormIsPrimary] = useState(false);

  const [allSports, setAllSports] = useState<Sport[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    loadInitialData();
  }, [router]);

  const loadInitialData = async () => {
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
      setAthlete(athleteData);

      if (!athleteData || !athleteData.id) {
        setError('No athlete profile found');
        return;
      }

      // Get all sports and positions first
      const sportsRes = await fetchWithAuth('/sports');
      const sports: Sport[] = sportsRes?.ok ? await sportsRes.json() : [];
      setAllSports(sports);

      const positionsRes = await fetchWithAuth('/positions');
      const positions: Position[] = positionsRes?.ok ? await positionsRes.json() : [];
      setAllPositions(positions);

      // Get athlete sports
      const athleteSportsRes = await fetchWithAuth(`/athlete-sports/${athleteData.id}`);
      const athleteSports = athleteSportsRes?.ok ? await athleteSportsRes.json() : [];

      if (!Array.isArray(athleteSports) || athleteSports.length === 0) {
        setError('No sports found for this athlete');
        setSportCards([]);
        return;
      }

      // Group by sport and build cards
      const sportsMap = new Map<string, SportCard>();

      athleteSports.forEach((athleteSport: any) => {
        if (!sportsMap.has(athleteSport.sport_id)) {
          const sport = sports.find(s => s.id === athleteSport.sport_id);
          if (sport) {
            sportsMap.set(athleteSport.sport_id, {
              sport,
              positions: [],
              isPrimary: athleteSport.is_primary,
              athleteSportIds: [],
            });
          }
        }

        // Add positions and track athlete-sport IDs
        const position = positions.find(p => p.id === athleteSport.position_id);
        if (position) {
          const card = sportsMap.get(athleteSport.sport_id);
          if (card) {
            if (!card.positions.find(p => p.id === position.id)) {
              card.positions.push(position);
            }
            card.athleteSportIds.push(athleteSport.id);
          }
        }
      });

      setSportCards(Array.from(sportsMap.values()));
    } catch (err) {
      console.error('Error loading sports:', err);
      setError('An error occurred while loading sports');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSport = () => {
    setEditingCard(null);
    setFormSportId('');
    setSelectedPositions([]);
    setFormIsPrimary(false);
    setShowModal(true);
  };

  const handleEditSport = (card: SportCard) => {
    setEditingCard(card);
    setFormSportId(card.sport.id);
    setSelectedPositions(card.positions.map(p => p.id));
    setFormIsPrimary(card.isPrimary);
    setMenuOpenId(null);
    setShowModal(true);
  };

  const handleDeleteSport = async (card: SportCard) => {
    if (!window.confirm(`Delete ${card.sport.name}?`)) return;

    try {
      // Delete all athlete-sport records for this sport
      for (const id of card.athleteSportIds) {
        await fetchWithAuth(`/athlete-sports/${id}`, { method: 'DELETE' });
      }

      // Reload sports
      await loadInitialData();
      setMenuOpenId(null);
    } catch (err) {
      console.error('Error deleting sport:', err);
      alert('Failed to delete sport');
    }
  };

  const handleSaveSport = async () => {
    if (!formSportId || selectedPositions.length === 0 || !athlete) {
      alert('Please select a sport and at least one position');
      return;
    }

    try {
      if (editingCard) {
        // Delete old entries
        for (const id of editingCard.athleteSportIds) {
          await fetchWithAuth(`/athlete-sports/${id}`, { method: 'DELETE' });
        }
      }

      // Create new entries for each position
      for (const positionId of selectedPositions) {
        await fetchWithAuth('/athlete-sports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            athlete_id: athlete.id,
            sport_id: formSportId,
            position_id: positionId,
            is_primary: formIsPrimary,
          }),
        });
      }

      setShowModal(false);
      await loadInitialData();
    } catch (err) {
      console.error('Error saving sport:', err);
      alert('Failed to save sport');
    }
  };

  const handleTogglePosition = (positionId: string) => {
    setSelectedPositions(prev =>
      prev.includes(positionId)
        ? prev.filter(id => id !== positionId)
        : [...prev, positionId]
    );
  };

  const availablePositions = allPositions.filter(p => p.sport_id === formSportId);

  return (
    <div style={styles.page}>
      {/* Header with Add Button */}
      <div style={styles.headerSection}>
        <div>
          <p style={styles.kicker}>Sport Summary</p>
          <h1 style={styles.heading}>Sports & Positions</h1>
          <p style={styles.subtitle}>
            View the sports you participate in and the positions you play.
          </p>
        </div>
        <button style={styles.addSportBtn} onClick={handleAddSport}>
          + Add Sport
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.centerContent}>
          <p style={styles.loadingText}>Loading your sports...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={styles.errorCard}>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={loadInitialData}>
            Try Again
          </button>
        </div>
      )}

      {/* Sports Cards */}
      {!loading && !error && sportCards.length > 0 && (
        <div style={styles.cardsGrid}>
          {sportCards.map((card) => (
            <div key={card.sport.id} style={styles.sportCard}>
              {/* Sport Header with Menu */}
              <div style={styles.sportHeaderTop}>
                <div>
                  <h2 style={styles.sportName}>{card.sport.name}</h2>
                  {card.sport.category && (
                    <p style={styles.sportCategory}>{card.sport.category}</p>
                  )}
                </div>
                <div style={styles.headerRight}>
                  {card.isPrimary && (
                    <span style={styles.primaryBadge}>Primary</span>
                  )}
                  <div style={styles.menuContainer}>
                    <button
                      style={styles.menuBtn}
                      onClick={() => setMenuOpenId(menuOpenId === card.sport.id ? null : card.sport.id)}
                    >
                      ⋮
                    </button>
                    {menuOpenId === card.sport.id && (
                      <div style={styles.menuPopup}>
                        <button
                          style={styles.menuItem}
                          onClick={() => handleEditSport(card)}
                        >
                          Edit Sport
                        </button>
                        <button
                          style={styles.menuItem}
                          onClick={() => handleDeleteSport(card)}
                        >
                          Delete Sport
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Positions List */}
              <div style={styles.positionsContainer}>
                <p style={styles.positionsLabel}>Positions:</p>
                <ul style={styles.positionsList}>
                  {card.positions.map((position) => (
                    <li key={position.id} style={styles.positionItem}>
                      <span style={styles.positionBullet}>•</span>
                      <span style={styles.positionName}>{position.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer */}
              <div style={styles.cardFooter}>
                <p style={styles.footerText}>
                  {card.positions.length} position{card.positions.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sportCards.length === 0 && (
        <div style={styles.emptyCard}>
          <p style={styles.emptyText}>No sports found for your profile yet.</p>
          <p style={styles.emptySubText}>Add a sport to get started!</p>
          <button style={styles.emptyAddBtn} onClick={handleAddSport}>
            + Add Sport
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingCard ? 'Edit Sport' : 'Add Sport'}
              </h2>
              <button
                style={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Sport Select */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Sport:</label>
                <select
                  style={styles.select}
                  value={formSportId}
                  onChange={(e) => {
                    setFormSportId(e.target.value);
                    setSelectedPositions([]);
                  }}
                >
                  <option value="">Choose a sport...</option>
                  {allSports.map(sport => (
                    <option key={sport.id} value={sport.id}>
                      {sport.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Positions Checkboxes */}
              {formSportId && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Select Positions:</label>
                  <div style={styles.checkboxContainer}>
                    {availablePositions.length > 0 ? (
                      availablePositions.map(position => (
                        <label key={position.id} style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={selectedPositions.includes(position.id)}
                            onChange={() => handleTogglePosition(position.id)}
                            style={styles.checkbox}
                          />
                          {position.name}
                        </label>
                      ))
                    ) : (
                      <p style={styles.noPositions}>No positions available for this sport</p>
                    )}
                  </div>
                </div>
              )}

              {/* Primary Sport Checkbox */}
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                    style={styles.checkbox}
                  />
                  Make this my primary sport
                </label>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                style={styles.saveBtn}
                onClick={handleSaveSport}
                disabled={!formSportId || selectedPositions.length === 0}
              >
                {editingCard ? 'Update' : 'Add'} Sport
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '40px',
    gap: '20px',
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

  addSportBtn: {
    padding: '12px 24px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.spacing.borderRadius,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
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

  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  } as CSSProperties,

  sportCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    padding: theme.spacing.cardPadding,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    border: `1px solid ${theme.colors.border}`,
    display: 'flex',
    flexDirection: 'column',
  } as CSSProperties,

  sportHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${theme.colors.border}`,
  } as CSSProperties,

  sportName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    margin: '0 0 4px 0',
  } as CSSProperties,

  sportCategory: {
    fontSize: 12,
    color: theme.colors.textMuted,
    margin: 0,
    fontWeight: 500,
  } as CSSProperties,

  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as CSSProperties,

  primaryBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: theme.colors.white,
    backgroundColor: theme.colors.success,
    padding: '4px 12px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  } as CSSProperties,

  menuContainer: {
    position: 'relative',
  } as CSSProperties,

  menuBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: '4px 8px',
    color: theme.colors.textMuted,
    transition: 'color 0.2s',
  } as CSSProperties,

  menuPopup: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.spacing.borderRadius,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
    minWidth: '160px',
  } as CSSProperties,

  menuItem: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: 14,
    color: theme.colors.textPrimary,
    transition: 'background-color 0.2s',
  } as CSSProperties,

  positionsContainer: {
    flex: 1,
    marginBottom: '16px',
  } as CSSProperties,

  positionsLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    margin: '0 0 12px 0',
  } as CSSProperties,

  positionsList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  } as CSSProperties,

  positionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: 14,
    color: theme.colors.textPrimary,
  } as CSSProperties,

  positionBullet: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  } as CSSProperties,

  positionName: {
    color: theme.colors.textPrimary,
  } as CSSProperties,

  cardFooter: {
    paddingTop: '12px',
    borderTop: `1px solid ${theme.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as CSSProperties,

  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    margin: 0,
    fontWeight: 500,
  } as CSSProperties,

  emptyCard: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '48px 24px',
    backgroundColor: theme.colors.card,
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: theme.spacing.borderRadius,
    textAlign: 'center',
  } as CSSProperties,

  emptyText: {
    fontSize: 18,
    fontWeight: 600,
    color: theme.colors.textPrimary,
    margin: '0 0 8px 0',
  } as CSSProperties,

  emptySubText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    margin: '0 0 16px 0',
  } as CSSProperties,

  emptyAddBtn: {
    padding: '10px 20px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.spacing.borderRadius,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  } as CSSProperties,

  modal: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.spacing.borderRadius,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  } as CSSProperties,

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: `1px solid ${theme.colors.border}`,
  } as CSSProperties,

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    margin: 0,
  } as CSSProperties,

  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 24,
    cursor: 'pointer',
    color: theme.colors.textMuted,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,

  modalBody: {
    padding: '24px',
  } as CSSProperties,

  formGroup: {
    marginBottom: '20px',
  } as CSSProperties,

  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: theme.colors.textPrimary,
    marginBottom: '8px',
  } as CSSProperties,

  select: {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    fontSize: 14,
    fontFamily: 'inherit',
    backgroundColor: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
  } as CSSProperties,

  checkboxContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingLeft: '8px',
  } as CSSProperties,

  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: 14,
    color: theme.colors.textPrimary,
  } as CSSProperties,

  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  } as CSSProperties,

  noPositions: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  } as CSSProperties,

  modalFooter: {
    display: 'flex',
    gap: '12px',
    padding: '24px',
    borderTop: `1px solid ${theme.colors.border}`,
    justifyContent: 'flex-end',
  } as CSSProperties,

  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: theme.colors.border,
    color: theme.colors.textPrimary,
    border: 'none',
    borderRadius: theme.spacing.borderRadius,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,

  saveBtn: {
    padding: '10px 20px',
    backgroundColor: theme.colors.primary,
    color: theme.colors.white,
    border: 'none',
    borderRadius: theme.spacing.borderRadius,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  } as CSSProperties,
};