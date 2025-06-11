import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import useFetch from '../lib/useFetch';
import ChatPanel from '../components/ChatPanel';

export default function Users() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const [chatUser, setChatUser] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Users">
      <div className="max-w-screen-lg mx-auto space-y-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4">
            Discover People
          </h1>
          <input
            type="text"
            placeholder="Search for users..."
            className="w-full max-w-md p-4 rounded-2xl bg-white bg-opacity-70 backdrop-blur-sm text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#b53133] shadow-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </motion.div>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <AnimatePresence>
            {filtered.map((u) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                className="bg-white bg-opacity-90 backdrop-blur-sm p-4 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {u.photo ? (
                    <img
                      src={u.photo}
                      alt={u.username}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#b53133]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-base font-bold text-gray-600 border-2 border-[#b53133]">
                      {u.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/profile/${u.username}`}
                      className="text-base font-semibold text-gray-800 hover:text-[#b53133] transition"
                    >
                      {u.username}
                    </Link>
                  </div>
                  <motion.button
                    className="px-3 py-1 rounded-xl bg-[#b53133] text-white text-sm font-semibold hover:bg-[#a12b2e] transition"
                    onClick={() => {
                      setChatUser(u.username);
                      setChatOpen(true);
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Chat
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-500 text-lg mt-8"
          >
            No users found. Try a different search!
          </motion.div>
        )}
        <ChatPanel
          open={chatOpen}
          user={chatUser}
          onClose={() => setChatOpen(false)}
        />
      </div>
    </Layout>
  );
}