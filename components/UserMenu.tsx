import Link from 'next/link';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

interface UserMenuProps {
  onOpen: () => void;
}

export default function UserMenu({ onOpen }: UserMenuProps) {
  const username = useUser();
  const isAuthenticated = !!username && username.trim() !== '';

  const { data, error } = useFetch<{ users: any[] }>(
    isAuthenticated ? '/api/users' : null
  );
  const userInfo = data?.users?.find((u: any) => u?.username === username);

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        title="Sign In"
      >
        <Icon name="box-arrow-in-right" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </Link>
    );
  }

  if (error) {
    return (
      <button
        onClick={onOpen}
        className="p-2 rounded-full bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
        title="Error loading user data"
      >
        <Icon name="exclamation-triangle" className="w-6 h-6 text-red-500" />
      </button>
    );
  }

  if (!data) {
    return (
      <div className="p-2 rounded-full" title="Loading user data...">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#b53133] dark:border-gray-600"></div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none"
      aria-label="User menu"
      type="button"
    >
      {userInfo?.photo ? (
        <img
          src={userInfo.photo}
          alt={`Avatar of ${userInfo.name || username}`}
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
        />
      ) : (
        <Icon name="person-circle" className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      )}
    </button>
  );
}
