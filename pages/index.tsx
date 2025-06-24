import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Calendar from '../components/Calendar';
import SummaryFeed from '../components/SummaryFeed';
import Skeleton from '../components/Skeleton';
import Icon from '../components/Icon';
import SearchOverlay from '../components/SearchOverlay';
import UserMenu from '../components/UserMenu';
import TasksPanel from '../components/TasksPanel';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';
import useUserMenu from '../lib/useUserMenu';

type Summary = { total: number; complete: number; failed: number; avgPunctuality: number };

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const username = useUser();
  const { data: userData } = useFetch<{ user: any }>(username ? '/api/user' : null);
  const user = userData?.user;
  const loadingUser = !!username && userData === undefined;
  const { setOpen: setUserMenuOpen } = useUserMenu();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/summary')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => {});
  }, []);

  const cards = [
    { id: 'total', title: 'Total Tasks', value: summary?.total ?? 0 },
    { id: 'complete', title: 'Completed', value: summary?.complete ?? 0 },
    { id: 'failed', title: 'Failed', value: summary?.failed ?? 0 },
    { id: 'avg', title: 'Avg Punctuality (m)', value: summary?.avgPunctuality ?? 0 },
  ];

  const navLinks = [
    { href: '/feed', icon: 'chat', label: 'Feed' },
    { href: '/upload', icon: 'upload', label: 'Upload' },
    { href: '/driver-routes', icon: 'signpost', label: 'Driver Routes' },
    { href: '/full-report', icon: 'table-list', label: 'Full Report' },
    { href: '/van-state', icon: 'truck', label: 'Van State' },
    { href: '/users', icon: 'people', label: 'Users' },
    { href: '/messages', icon: 'chat-left', label: 'Messages' },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <Layout title="Home" fullWidth hideNavbar>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        className="relative rounded-2xl overflow-hidden shadow-xl mb-8"
      >
        {user?.header ? (
          <img
            src={user.header}
            alt="header"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#b53133] via-gray-800 to-gray-900" />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          {/* Информация о пользователе */}
          <motion.div
            className="flex items-center gap-4 flex-shrink-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 15 }}
          >
            {loadingUser ? (
              <Skeleton className="w-28 h-28 rounded-full border-4 border-white shadow-xl" />
            ) : user?.photo ? (
              <img
                src={user.photo}
                alt="avatar"
                onClick={() => setUserMenuOpen(true)}
                className="w-28 h-28 cursor-pointer rounded-full object-cover border-4 border-white shadow-xl transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div
                onClick={() => setUserMenuOpen(true)}
                className="w-28 h-28 cursor-pointer rounded-full bg-white/30 flex items-center justify-center text-5xl font-extrabold text-white border-4 border-white shadow-xl"
              >
                {(user?.username || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-white">
              <h2 className="text-3xl font-extrabold">
                {loadingUser ? <Skeleton className="w-40 h-8" /> : user?.username || 'Guest'}
              </h2>
              {loadingUser ? (
                <Skeleton className="mt-2 w-24 h-4" />
              ) : user ? null : (
                <Link
                  href="/auth/login"
                  className="text-sm text-white hover:text-[#b53133] transition"
                >
                  Sign in to your account
                </Link>
              )}
            </div>
          </motion.div>

          {/* Кнопки навигации */}
          <div className="flex flex-wrap justify-center gap-2 flex-1">
          <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg border border-white/10 bg-white/20 hover:bg-white/30 text-white"

              aria-label="Open search"
            >
              <Icon name="search" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTasksOpen(true)}
              className="p-2 rounded-lg border border-white/10 bg-white/20 hover:bg-white/30 text-white"
              aria-label="Open tasks"
            >
              <Icon name="star" className="w-4 h-4" />
              
            </button>
            {navLinks.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/20 hover:bg-white/30 text-white transition ${
                  isActive(href) ? 'bg-white/40' : ''
                }`}
              >
                <Icon name={icon} className="w-4 h-4" />
                <span className="text-sm">{label}</span>
              </Link>
              
            ))}

          </div>

          {/* Карточки */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 15 }}
          >
            {cards.map((c) => (
              <motion.div
                key={c.id}
                className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10 hover:bg-white/40 transition cursor-pointer"
                whileHover={{ scale: 1.05, rotate: 2, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen(c.id)}
              >
                <h3 className="text-sm font-semibold text-white">{c.title}</h3>
                <p className="text-2xl font-bold text-white">{c.value}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-[3] w-full md:w-62">
          <Calendar />
        </div>
        <div className="flex-[5] min-w-[900px] ">
          <SummaryFeed />
        </div>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)}>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">{cards.find((c) => c.id === open)?.title}</h2>
          <div className="h-40 flex items-center justify-center text-gray-500">Graph Placeholder</div>
        </div>
      </Modal>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
      <UserMenu showButton={false} />
    </Layout>
  );
}