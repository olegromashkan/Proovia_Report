import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';
import NotificationsPanel from './NotificationsPanel';
import WelcomeModal from './WelcomeModal';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';
import useNotifications from '../lib/useNotifications';
import useUserMenu from '../lib/useUserMenu';
import ThemeToggle from './ThemeToggle';



interface UserMenuProps {
  /**
   * Display the trigger avatar button. Set to false when the menu
   * should be opened programmatically from another element.
   */
  showButton?: boolean;
}

export default function UserMenu({ showButton = true }: UserMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, setOpen } = useUserMenu();
  const [imageError, setImageError] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const { items } = useNotifications();
  const unreadCount = items.length;
  
  const username = useUser();
  // Check that username is not empty string and not null/undefined
  const isAuthenticated = username && username.trim() !== '';
  
  const { data, error } = useFetch<{ users: any[] }>(isAuthenticated ? '/api/users' : null);
  const userInfo = data?.users?.find((u: any) => u?.username === username);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      try {
        localStorage.removeItem('current-user');
      } catch {}
      // Close menu and redirect
      setOpen(false);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const panel =
    open && (
      <div
        className="fixed inset-0 z-50 flex items-start justify-start p-4 bg-black/40"
        onClick={e => e.target === e.currentTarget && setOpen(false)}
      >
        <div
          ref={menuRef}
          className="w-96 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              {userInfo?.photo && !imageError ? (
                <img
                  src={userInfo.photo}
                  alt={`Avatar of ${userInfo.name || username}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon name="person" className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {userInfo?.name || userInfo?.displayName || username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{username}</p>
                <ThemeToggle />

              </div>
            </div>
          </div>
          <div className="py-1">
            <Link
              href={`/profile/${username}`}
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Icon name="person" className="w-4 h-4 mr-3 text-gray-400" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Icon name="gear" className="w-4 h-4 mr-3 text-gray-400" />
              Settings
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                setWelcomeOpen(true);
              }}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              type="button"
            >
              <Icon name="info-circle" className="w-4 h-4 mr-3 text-gray-400" />
              Welcome Page
            </button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            type="button"
          >
            <Icon name="box-arrow-right" className="w-4 h-4 mr-3" />
            Sign Out
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 mt-3" />
          <NotificationsPanel />
        </div>
      </div>
    );

  // If user is not authenticated - show login button
  if (!isAuthenticated) {
    const trigger = showButton ? (
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        title="Sign In"
      >
        <Icon name="box-arrow-in-right" className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </Link>
    ) : null;

    return <>{trigger}{panel}</>;
  }

  // If there's an error loading user data
  if (error) {
    const trigger = showButton ? (
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 bg-red-50 border border-red-200"
        title="Error loading user data"
      >
        <Icon name="exclamation-triangle" className="w-6 h-6 text-red-500" />
      </button>
    ) : null;

    return (
      <>
        {trigger}
        {panel}
      </>
    );
  }

  // Show loading indicator if data is not loaded yet
  if (!data) {
    const trigger = showButton ? (
      <div className="p-2 rounded-full" title="Loading user data...">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#b53133] dark:border-gray-600"></div>
      </div>
    ) : null;

    return <>{trigger}{panel}</>;
  }

  // Main interface for authenticated user
  const trigger = showButton ? (
    <button
      onClick={() => setOpen(!open)}
      className="relative p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#b53133] focus:ring-offset-2"
      aria-label="User menu"
      aria-expanded={open}
      type="button"
    >
      {userInfo?.photo && !imageError ? (
        <img
          src={userInfo.photo}
          alt={`Avatar of ${userInfo.name || username}`}
          className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
          onError={handleImageError}
        />
      ) : (
        <Icon name="person-circle" className="w-8 h-8 text-gray-600 dark:text-gray-400" />
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full text-xs px-1">
          {unreadCount}
        </span>
      )}
    </button>
  ) : null;

  return (
    <>
      {trigger}
      {panel}
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
    </>
  );
}