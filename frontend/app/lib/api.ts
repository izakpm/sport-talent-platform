export const API_URL = 'http://localhost:3000';

export const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // ✅ AUTO LOGOUT ON 401
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  return res;
};