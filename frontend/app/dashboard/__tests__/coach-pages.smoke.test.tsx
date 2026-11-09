import { render, screen } from '@testing-library/react';
import CoachTeamsPage from '../coaches/teams/page';
import CoachCalanderPage from '../coaches/calander/page';
import CoachActivitiesPage from '../coaches/activities/page';
import CoachMatchesPage from '../coaches/matches/page';
import CoachApprovalsPage from '../coaches/approvals/page';
import CoachAchievementsPage from '../coaches/achievements/page';

const pushMock = jest.fn();
const routerMock = {
  push: pushMock,
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

describe('coach pages smoke tests', () => {
  it('renders Teams page core sections', () => {
    render(<CoachTeamsPage />);
    expect(screen.getByRole('heading', { name: 'Teams' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team List' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Team Details' })).toBeInTheDocument();
  });

  it('renders Calander page core sections', () => {
    render(<CoachCalanderPage />);
    expect(screen.getByRole('heading', { name: 'Calendar' })).toBeInTheDocument();
    expect(screen.getByText('Loading your calendar...')).toBeInTheDocument();
  });

  it('renders Activities page core sections', () => {
    render(<CoachActivitiesPage />);
    expect(screen.getByRole('heading', { name: 'Activities' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Athlete Activity Feed' })).toBeInTheDocument();
  });

  it('renders Matches page core sections', () => {
    render(<CoachMatchesPage />);
    expect(screen.getByRole('heading', { name: 'Matches' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Fixture Board' })).toBeInTheDocument();
  });

  it('renders Approvals page core sections', () => {
    render(<CoachApprovalsPage />);
    expect(screen.getByRole('heading', { name: 'Approvals' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pending Queue' })).toBeInTheDocument();
  });

  it('renders Achievements page core sections', () => {
    render(<CoachAchievementsPage />);
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Achievement Board' })).toBeInTheDocument();
  });
});
