import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

export default function UserMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [status, setStatus] = useState('online');
  const [statusText, setStatusText] = useState('');
  
  const username = useUser();
  // Check that username is not empty string and not null/undefined
  const isAuthenticated = username && username.trim() !== '';
  
  const { data, error } = useFetch<{ users: any[] }>(isAuthenticated ? '/api/users' : null);
  const { data: statusData, mutate: refreshStatus } = useFetch<{ status: string; status_message: string; last_seen: string }>(isAuthenticated ? '/api/status' : null);
  useEffect(() => {
    if (statusData) {
      setStatus(statusData.status);
      setStatusText(statusData.status_message || '');
    }
  }, [statusData]);
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

  const saveStatus = async (newStatus: string, message = statusText) => {
    setStatus(newStatus);
    await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, message }),
    });
    refreshStatus();
  };

  // If user is not authenticated - show login button
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

  // If there's an error loading user data
  if (error) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 bg-red-50 border border-red-200"
          title="Error loading user data"
        >
          <Icon name="exclamation-triangle" className="w-6 h-6 text-red-500" />
        </button>
        
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
            <div className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
              Error loading data
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Icon name="box-arrow-right" className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show loading indicator if data is not loaded yet
  if (!data) {
    return (
      <div className="p-2 rounded-full" title="Loading user data...">
        <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 dark:border-gray-600 dark:border-t-blue-400"></div>
      </div>
    );
  }

  // Main interface for authenticated user
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${status === 'online' ? 'bg-green-500' : status === 'away' ? 'bg-orange-500' : status === 'dnd' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1">
          {/* User information */}
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
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  @{username}
                </p>
                {statusText && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{statusText}</p>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <select
                className="select select-sm w-full"
                value={status}
                onChange={e => saveStatus(e.target.value)}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="dnd">Do Not Disturb</option>
                <option value="offline">Offline</option>
              </select>
              <input
                type="text"
                className="input input-sm w-full"
                placeholder="Set a status message"
                value={statusText}
                onChange={e => setStatusText(e.target.value)}
                onBlur={() => saveStatus(status, statusText)}
              />
            </div>
          </div>

          {/* Navigation links */}
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
          </div>
          
          {/* Separator */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          
          {/* Sign out button */}
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            type="button"
          >
            <Icon name="box-arrow-right" className="w-4 h-4 mr-3" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}