import useCachedFetch from './useCachedFetch';
import useUser from './useUser';

export default function useCurrentUser(ttl = 24 * 3600 * 1000) {
  const username = useUser();
  const key = 'current-user';
  const { data } = useCachedFetch<{ user: any }>(username ? key : null, username ? '/api/user' : null, ttl);
  return data?.user;
}
