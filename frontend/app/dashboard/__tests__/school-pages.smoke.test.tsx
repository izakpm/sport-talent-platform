import { render, screen } from '@testing-library/react';
import SchoolCoachesPage from '../schools/coaches/page';
import SchoolTeamsPage from '../schools/teams/page';
import SchoolFixturesPage from '../schools/fixtures/page';
import SchoolLogsPage from '../schools/logs/page';
import SchoolAchievementsPage from '../schools/achievements/page';

describe('school pages smoke tests', () => {
  it('renders Coaches page core sections', () => {
    render(<SchoolCoachesPage />);
    expect(screen.getByRole('heading', { name: 'Coaches' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search coach, role, or sport')).toBeInTheDocument();
  });

  it('renders Teams page core sections', () => {
    render(<SchoolTeamsPage />);
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Details' })).toBeInTheDocument();
  });

  it('renders Fixtures page core sections', () => {
    render(<SchoolFixturesPage />);
    expect(screen.getByRole('heading', { name: 'Fixtures' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fixture List' })).toBeInTheDocument();
  });

  it('renders tournament standings on the Logs route', () => {
    render(<SchoolLogsPage />);
    expect(screen.getByRole('heading', { name: 'Tournament Standings' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });

  it('renders Achievements page core sections', () => {
    render(<SchoolAchievementsPage />);
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByText('All categories')).toBeInTheDocument();
  });
});
