import { render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../LoginForm';

const replace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: jest.fn() }) }));

describe('Google login completion', () => {
  beforeEach(() => {
    localStorage.clear();
    replace.mockClear();
    window.history.replaceState({}, '', '/login#token=google-test-token');
    global.fetch = jest.fn();
  });

  it('verifies the session, removes the URL token, and opens the role router', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ userId: '123', email: 'test@example.com', role: 'COACH' }) });
    render(<LoginPage />);
    expect(window.location.hash).toBe('');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    expect(localStorage.getItem('token')).toBe('google-test-token');
    expect(JSON.parse(localStorage.getItem('user')!).role).toBe('COACH');
  });

  it('clears an invalid session and shows a retry message', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<LoginPage />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again');
    expect(localStorage.getItem('token')).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
