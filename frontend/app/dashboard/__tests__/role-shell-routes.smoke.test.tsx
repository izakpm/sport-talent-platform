import { render, screen, waitFor } from '@testing-library/react';
import AthleteDashboardPage from '../athlete/page';
import CoachDashboardPage from '../coaches/page';
import SchoolDashboardPage from '../schools/page';

const pushMock = jest.fn();
const routerMock = {
  push: pushMock,
};

jest.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

jest.mock('../../lib/api', () => ({
  fetchWithAuth: jest.fn(async (path: string) => {
    if (path.startsWith('/athletes/user/')) {
      return {
        ok: true,
        text: async () => JSON.stringify({ id: 'athlete-1' }),
      };
    }

    if (path.startsWith('/athlete-sports/')) {
      return {
        ok: true,
        json: async () => [
          { sport_id: 'soccer' },
          { sport_id: 'rugby' },
        ],
      };
    }

    if (path === '/activities') {
      return {
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }, { id: 3 }],
      };
    }

    if (path === '/verification') {
      return {
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }],
      };
    }

    return {
      ok: true,
      json: async () => [],
      text: async () => '',
    };
  }),
}));

function seedAuthStorage(role: 'ATHLETE' | 'COACH' | 'SCHOOL') {
  localStorage.setItem('token', 'test-token');
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: 'user-1',
      first_name: 'Test',
      role,
    }),
  );
}

describe('T018 role shell route smoke tests', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
  });

  it('renders athlete dashboard shell route', async () => {
    seedAuthStorage('ATHLETE');
    render(<AthleteDashboardPage />);

    expect(
      await screen.findByRole('heading', { name: 'Welcome back, Test.' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Your team journey starts here.')).toBeInTheDocument();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });

  it('renders coach dashboard shell route', async () => {
    seedAuthStorage('COACH');
    render(<CoachDashboardPage />);

    expect(
      await screen.findByRole('heading', { name: 'Your next great month, Test.' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('The month at a glance')).toBeInTheDocument();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });

  it('renders school dashboard shell route', async () => {
    seedAuthStorage('SCHOOL');
    render(<SchoolDashboardPage />);

    expect(
      await screen.findByRole('heading', { name: 'My Dashboard' }),
    ).toBeInTheDocument();
    expect(screen.getByText('School Dashboard')).toBeInTheDocument();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });
});