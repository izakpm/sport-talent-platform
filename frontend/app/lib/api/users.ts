import { fetchWithAuth } from '../api';

export const fetchUsersByRole = (role: string) => {
  return fetchWithAuth(`/users/role/${encodeURIComponent(role)}`);
};
