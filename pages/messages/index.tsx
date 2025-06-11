import { useState } from 'react';
import Layout from '../../components/Layout';
import useFetch from '../../lib/useFetch';
import ChatWindow from '../../components/ChatWindow';

export default function MessagesPage() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const users = data?.users || [];
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Messages" fullWidth>
      <div className="flex flex-col md:flex-row gap-4 h-[80vh] mx-auto max-w-6xl p-4">
        <div className="w-full md:w-64 shrink-0 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="input input-bordered flex-1"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto max-h-full pr-2 space-y-2">
            {filtered.map((u) => (
              <button
                key={u.id}
                onClick={() => setActive(u.username)}
                className={`w-full flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                  active === u.username
                    ? 'bg-blue-100 dark:bg-gray-700 border-blue-200 dark:border-gray-600'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {u.photo ? (
                  <img src={u.photo} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {u.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="flex-1 truncate">{u.username}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <ChatWindow user={active} />
        </div>
      </div>
    </Layout>
  );
}
