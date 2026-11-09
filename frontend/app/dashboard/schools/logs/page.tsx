'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import { theme } from '../../../styles/theme';
import { MetricCard, SurfaceCard } from '../../components/primitives';
import { SCHOOL_TOURNAMENTS } from '../mock-data';

export default function SchoolLogsPage() {
  const [selectedTournamentId, setSelectedTournamentId] = useState(SCHOOL_TOURNAMENTS[0]?.id ?? '');

  const selectedTournament = useMemo(
    () => SCHOOL_TOURNAMENTS.find((t) => t.id === selectedTournamentId),
    [selectedTournamentId],
  );

  const divisions = selectedTournament?.divisions ?? [];

  return (
    <div style={styles.page}>
      <p style={styles.kicker}>School</p>
      <h1 style={styles.heading}>Tournament Standings</h1>
      <p style={styles.description}>View tournament standings and competition results for your school teams.</p>

      {selectedTournament && (
        <div style={styles.metricsGrid}>
          <MetricCard label="Tournament" value={selectedTournament.name} />
          <MetricCard label="Sport" value={selectedTournament.sport} />
          <MetricCard label="Age Groups" value={divisions.length} />
        </div>
      )}

      <SurfaceCard style={styles.filterCard}>
        <div style={styles.filterRow}>
          <select
            style={styles.select}
            value={selectedTournamentId}
            onChange={(event) => setSelectedTournamentId(event.target.value)}
          >
            {SCHOOL_TOURNAMENTS.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      <div style={styles.divisionsGrid}>
        {divisions.map((division) => (
          <SurfaceCard key={division.name} style={styles.tableCard}>
            <h2 style={styles.tableTitle}>{division.name}</h2>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.headerRow}>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '5%' }}>Pos</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '50%' }}>School</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '9%' }}>G</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '9%' }}>W</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '9%' }}>L</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '9%' }}>D</th>
                    <th style={{ ...styles.cell, ...styles.headerCell, width: '9%' }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {division.standings.map((standing) => (
                    <tr key={standing.position} style={styles.bodyRow}>
                      <td style={{ ...styles.cell, ...styles.positionCell }}>{standing.position}</td>
                      <td style={{ ...styles.cell, textAlign: 'left' }}>{standing.schoolName}</td>
                      <td style={styles.cell}>{standing.gamesPlayed}</td>
                      <td style={styles.cell}>{standing.wins}</td>
                      <td style={styles.cell}>{standing.losses}</td>
                      <td style={styles.cell}>{standing.draws}</td>
                      <td style={{ ...styles.cell, ...styles.pointsCell }}>{standing.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 24 },
  kicker: { margin: 0, color: theme.colors.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 },
  heading: { margin: 0, color: theme.colors.textPrimary, fontSize: 32, fontWeight: 700 },
  description: { margin: 0, color: theme.colors.textMuted, lineHeight: 1.6, fontSize: 15, maxWidth: 600 },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  filterCard: { padding: 16 },
  filterRow: { display: 'flex', gap: 12, alignItems: 'center' },
  select: {
    borderRadius: 10,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.inputBackground,
    color: theme.colors.textPrimary,
    padding: '10px 12px',
    minWidth: 200,
    fontSize: 14,
  },
  divisionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
  },
  tableCard: { padding: 24 },
  tableTitle: { margin: '0 0 16px', color: theme.colors.textPrimary, fontSize: 18, fontWeight: 600 },
  tableWrapper: { overflowX: 'auto' },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  headerRow: {
    background: theme.colors.primary,
    borderBottom: `2px solid ${theme.colors.primary}`,
  },
  headerCell: {
    fontWeight: 700,
    color: theme.colors.white,
    textAlign: 'center' as const,
    padding: '12px 8px',
  },
  bodyRow: {
    borderBottom: `1px solid ${theme.colors.border}`,
    background: theme.colors.white,
    transition: 'background-color 0.2s',
  },
  cell: {
    padding: '12px 8px',
    textAlign: 'center' as const,
    color: theme.colors.textPrimary,
  },
  positionCell: {
    fontWeight: 600,
    color: theme.colors.primary,
  },
  pointsCell: {
    fontWeight: 700,
    background: theme.colors.accent,
    color: theme.colors.primary,
  },
};
