import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

interface UserPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function UserPanel({ open, onClose }: UserPanelProps) {
  const router = useRouter();
  const username = useUser();
  const isAuthenticated = !!username && username.trim() !== '';
  const [imageError, setImageError] = useState(false);

  const { data, error } = useFetch<{ users: any[] }>(
    isAuthenticated ? '/api/users' : null
  );
  const userInfo = data?.users?.find((u: any) => u?.username === username);

  const handleLogout = async () => {
    await fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    onClose();
    router.push('/auth/login');
  };

  useEffect(() => {
    if (open) setImageError(false);
  }, [open]);

  if (!open) return null;

  if (!isAuthenticated) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 w-full max-w-xs bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 p-4 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Account</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
          <Link href="/auth/login" className="block w-full text-center bg-[#b53133] text-white py-2 rounded-lg" onClick={onClose}>
            Sign In
          </Link>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-6 right-6 w-full max-w-xs bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-50 p-4 space-y-4"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Account</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700 pb-4">
          {userInfo?.photo && !imageError ? (
            <img
              src={userInfo.photo}
              alt={`Avatar of ${userInfo.name || username}`}
              className="w-10 h-10 rounded-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Icon name="person-circle" className="w-10 h-10 text-gray-400" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {userInfo?.name || userInfo?.displayName || username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{username}</p>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">Error loading data</div>
        )}
        <div className="space-y-2">
          <Link href={`/profile/${username}`} className="flex items-center px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose}>
            <Icon name="person" className="w-4 h-4 mr-2 text-gray-400" />
            Profile
          </Link>
          <Link href="/settings" className="flex items-center px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-700" onClick={onClose}>
            <Icon name="gear" className="w-4 h-4 mr-2 text-gray-400" />
            Settings
          </Link>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white rounded-md py-2 hover:bg-red-700 transition-colors">
          <Icon name="box-arrow-right" className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
