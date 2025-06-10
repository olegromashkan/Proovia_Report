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

  const username = useUser();
  const { data } = useFetch<{ users: any[] }>(username ? '/api/users' : null);
  const info = data?.users.find((u: any) => u.username === username);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const logout = async () => {
    await fetch('/api/logout');
    router.push('/auth/login');
  };

  if (!username) {
    return (
      <Link href="/auth/login" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" title="Login">
        <Icon name="box-arrow-in-right" className="w-6 h-6" />
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="User menu"
      >
        {info?.photo ? (
          <img
            src={info.photo}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <Icon name="person-circle" className="w-6 h-6" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-lg z-50 py-2">
          <Link
            href={`/profile/${username}`}
            className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Profile
          </Link>
          <Link
            href="/settings"
            className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Settings
          </Link>
          <button
            onClick={logout}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
