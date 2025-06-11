import { useEffect, useState, CSSProperties } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Calendar from '../components/Calendar';
import useUser from '../lib/useUser';
import useFetch from '../lib/useFetch';

type Summary = { total: number; complete: number; failed: number; avgPunctuality: number };

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const username = useUser();
  const { data: userData } = useFetch<{ user: any }>(username ? '/api/user' : null);
  const user = userData?.user;

  useEffect(() => {
    fetch('/api/summary')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setSummary)
      .catch(() => {});
  }, []);

  const cards = [
    { id: 'total', title: 'Total Trips', value: summary?.total ?? 0 },
    { id: 'complete', title: 'Completed', value: summary?.complete ?? 0 },
    { id: 'failed', title: 'Failed', value: summary?.failed ?? 0 },
    { id: 'avg', title: 'Avg Punctuality (m)', value: summary?.avgPunctuality ?? 0 },
  ];

  return (
    <Layout title="Home" fullWidth>
      <div className="relative rounded-2xl overflow-hidden shadow-lg mb-6">
        {user?.header ? (
          <img
            src={user.header}
            alt="header"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative flex flex-col sm:flex-row items-center">
          <div className="flex items-center gap-4 p-6 flex-1">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg brightness-90"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center text-4xl font-bold text-white border-4 border-white shadow-lg">
                {(user?.username || 'G').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {user?.username || 'Guest'}
              </h2>
              {!user && (
                <Link href="/auth/login" className="underline text-sm text-blue-200">
                  Sign in to your account
                </Link>
              )}
            </div>
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6"
            style={{ '--card-bg': 'rgba(0,0,0,0.4)' } as CSSProperties}
          >
            {cards.map((c) => (
              <Card
                key={c.id}
                title={c.title}
                value={c.value}
                onClick={() => setOpen(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <Calendar />

      <Modal open={!!open} onClose={() => setOpen(null)}>
        <h2 className="text-xl font-bold mb-2">{cards.find((c) => c.id === open)?.title}</h2>
        <div className="h-40 flex items-center justify-center text-gray-500">Graph Placeholder</div>
      </Modal>
    </Layout>
  );
}
