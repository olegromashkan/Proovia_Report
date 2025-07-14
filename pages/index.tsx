import React, { useState, useEffect, useCallback } from 'react'; // Added explicit React import
import type { GetServerSideProps } from 'next';
import useSWR, { mutate as globalMutate } from 'swr';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Calendar from '../components/Calendar';
import SummaryFeed, { FeedData } from '../components/SummaryFeed';
import Skeleton from '../components/Skeleton';
import SearchOverlay from '../components/SearchOverlay';
import UserMenu from '../components/UserMenu';
import TasksPanel from '../components/TasksPanel';
import WelcomeModal from '../components/WelcomeModal';
import AiChatPanel from '../components/AiChatPanel';
import PixelPet from '../components/PixelPet';
import { useRouter } from 'next/router';
import useUser from '../lib/useUser';
import useCurrentUser from '../lib/useCurrentUser';
import useUserMenu from '../lib/useUserMenu';
import { Sparkles } from 'lucide-react';

type Summary = { total: number; complete: number; failed: number; avgPunctuality: number };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home({ initialSummary, initialFeedData }: { initialSummary: Summary; initialFeedData: FeedData }) {
  const { data: summary, mutate: mutateSummary } = useSWR<Summary>('/api/summary', fetcher, {
    fallbackData: initialSummary,
    revalidateOnFocus: false, // Minor optimization: disable revalidation on focus
  });
  const [open, setOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const username = useUser();
  const user = useCurrentUser();
  const loadingUser = !!username && user === undefined;
  const { setOpen: setUserMenuOpen } = useUserMenu();
  const router = useRouter();

  useEffect(() => {
    const seen = localStorage.getItem('welcomeSeen');
    if (!seen) setWelcomeOpen(true);
  }, []);

  // Debounced refresh handler for performance
  const handleRefresh = useCallback(() => {
    mutateSummary();
    globalMutate((key) => typeof key === 'string' && key.startsWith('/api/summary-feed'));
  }, [mutateSummary]);

  useEffect(() => {
    window.addEventListener('forceRefresh', handleRefresh);
    return () => window.removeEventListener('forceRefresh', handleRefresh);
  }, [handleRefresh]);

  const cards = [
    { id: 'total', title: 'Total Tasks', value: summary?.total ?? 0 },
    { id: 'complete', title: 'Completed', value: summary?.complete ?? 0 },
    { id: 'failed', title: 'Failed', value: summary?.failed ?? 0 },
    { id: 'avg', title: 'Avg Punctuality (m)', value: summary?.avgPunctuality ?? 0 },
  ];

  const isActive = (href: string) => router.pathname === href;

  return (
    <Layout title="Home" fullWidth>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
        className="relative rounded-2xl bg-white/0 dark:bg-black/50 border border-white/20 dark:border-black/20 shadow-lg"
      >
        <div className="relative flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
          {/* User Info */}
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

          {/* Cards */}
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
        <div className="flex-[3] w-full md:w-62 p-4">
          <Calendar />
        </div>
        <div className="flex-[5] min-w-[900px] bg-white/70 dark:bg-black/50 p-4">
          <SummaryFeed initialData={initialFeedData as FeedData} />
        </div>
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)}>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">{cards.find((c) => c.id === open)?.title}</h2>
          <div className="h-40 flex items-center justify-center text-gray-500">Graph Placeholder</div>
        </div>
      </Modal>
      <WelcomeModal open={welcomeOpen} onClose={() => setWelcomeOpen(false)} />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAskAi={(q) => {
          setAiText(q);
          setSearchOpen(false);
          setAiOpen(true);
        }}
      />
      <TasksPanel open={tasksOpen} onClose={() => setTasksOpen(false)} />
      <AiChatPanel open={aiOpen} onClose={() => setAiOpen(false)} initialText={aiText} />
      <UserMenu showButton={false} />
      <PixelPet />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const protocol = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;

  // Concurrent fetching for performance
  const [summaryRes, feedRes] = await Promise.all([
    fetch(`${baseUrl}/api/summary`),
    fetch(`${baseUrl}/api/summary-feed`),
  ]);
  const [summary, feed] = await Promise.all([summaryRes.json(), feedRes.json()]);

  return { props: { initialSummary: summary, initialFeedData: feed } };
};