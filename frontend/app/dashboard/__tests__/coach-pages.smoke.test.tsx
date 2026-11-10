import { render, screen } from '@testing-library/react';
import CoachTeamsPage from '../coaches/teams/page';
import CoachSchedulePage from '../coaches/schedule/page';
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

jest.mock('../../lib/api', () => ({ fetchWithAuth: jest.fn(async () => ({ ok: true, json: async () => [] })) }));

describe('coach pages smoke tests', () => {
  it('renders Teams and its real empty state', async () => {
    render(<CoachTeamsPage />);
    expect(await screen.findByRole('heading', { name: 'Every great season starts with a team.' })).toBeInTheDocument();
  });
  it('asks for a team before scheduling', async () => {
    render(<CoachSchedulePage />);
    expect(await screen.findByRole('heading', { name: 'First, give your schedule a team.' })).toBeInTheDocument();
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

  it('renders Achievements page real empty state', async () => {
    render(<CoachAchievementsPage />);
    expect(screen.getByRole('heading', { name: 'Achievements' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Celebrate your first milestone.' })).toBeInTheDocument();
  });
});
