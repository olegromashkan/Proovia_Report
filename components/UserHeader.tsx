import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';
import useUserMenu from '../lib/useUserMenu';

interface UserInfo {
  username?: string;
  photo?: string;
}

interface UserHeaderProps {
  user: UserInfo | null | undefined;
  isLoading: boolean;
}

export default function UserHeader({ user, isLoading }: UserHeaderProps) {
  const { setOpen } = useUserMenu();
  const initial = (user?.username || 'G').charAt(0).toUpperCase();

  return (
    <motion.div
      className="flex items-center gap-4 flex-shrink-0"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 15 }}
    >
      <button
        onClick={() => setOpen(true)}
        className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden focus:outline-none focus:ring"
        aria-label="User menu"
        type="button"
      >
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : user?.photo ? (
          <img
            src={user.photo}
            alt="avatar"
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="flex items-center justify-center w-full h-full bg-white/30 text-5xl font-extrabold text-white">
            {initial}
          </span>
        )}
      </button>
      <div className="text-white">
        <h2 className="text-3xl font-extrabold">
          {isLoading ? <Skeleton className="w-40 h-8" /> : user?.username || 'Guest'}
        </h2>
        {isLoading ? (
          <Skeleton className="mt-2 w-24 h-4" />
        ) : user ? null : (
          <Link href="/auth/login" className="text-sm hover:text-[#b53133] transition">
            Sign in to your account
          </Link>
        )}
      </div>
    </motion.div>
  );
}

