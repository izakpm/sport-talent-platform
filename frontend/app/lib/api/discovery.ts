import { fetchWithAuth } from '../api';

export const fetchAthleteDiscovery = async (params: {
  sport_id?: string;
  position_id?: string;
  query?: string;
  public_only?: boolean;
}) => {
  const query = new URLSearchParams();
  if (params.sport_id) query.set('sport_id', params.sport_id);
  if (params.position_id) query.set('position_id', params.position_id);
  if (params.query) query.set('query', params.query);
  if (params.public_only) query.set('public_only', 'true');

  return fetchWithAuth(`/discovery/athletes?${query.toString()}`);
};

export const fetchCoachDiscovery = async (query?: string) => {
  const url = query
    ? `/discovery/coaches?query=${encodeURIComponent(query)}`
    : '/discovery/coaches';
  return fetchWithAuth(url);
};
