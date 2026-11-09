import { render, screen, waitFor } from '@testing-library/react';
import AthleteDashboardPage from '../athlete/page';
import CoachDashboardPage from '../coaches/page';
import SchoolDashboardPage from '../schools/page';

const pushMock = jest.fn();
const replaceMock = jest.fn();
const routerMock = {
  push: pushMock,
  replace: replaceMock,
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

    if (path.startsWith('/users/')) {
      return {
        ok: true,
        json: async () => ({ id: 'user-1', role: 'ATHLETE' }),
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

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
}

function assertResponsiveLayoutContracts() {
  const heroTitle = screen.getByRole('heading', { name: 'My Dashboard' });
  const heroSection = heroTitle.closest('div')?.parentElement;
  expect(heroSection).toBeTruthy();
  expect(heroSection).toHaveStyle({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  });

  const quickActionsHeading = screen.getByRole('heading', { name: 'Quick actions' });
  const cardsGrid = quickActionsHeading.closest('div')?.parentElement;
  expect(cardsGrid).toBeTruthy();
  expect(cardsGrid).toHaveStyle({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  });
}

describe('T019 responsive role layout tests', () => {
  beforeEach(() => {
    localStorage.clear();
    pushMock.mockReset();
    replaceMock.mockReset();
  });

  it('renders athlete layout at mobile and desktop breakpoints', async () => {
    seedAuthStorage('ATHLETE');

    setViewport(390, 844);
    const { unmount } = render(<AthleteDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Athlete Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());

    unmount();

    setViewport(1280, 800);
    render(<AthleteDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Athlete Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });

  it('renders coach layout at mobile and desktop breakpoints', async () => {
    seedAuthStorage('COACH');

    setViewport(390, 844);
    const { unmount } = render(<CoachDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Coach Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());

    unmount();

    setViewport(1280, 800);
    render(<CoachDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Coach Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });

  it('renders school layout at mobile and desktop breakpoints', async () => {
    seedAuthStorage('SCHOOL');

    setViewport(390, 844);
    const { unmount } = render(<SchoolDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('School Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());

    unmount();

    setViewport(1280, 800);
    render(<SchoolDashboardPage />);

    expect(await screen.findByRole('heading', { name: 'My Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('School Dashboard')).toBeInTheDocument();
    assertResponsiveLayoutContracts();
    await waitFor(() => expect(pushMock).not.toHaveBeenCalled());
  });
});
