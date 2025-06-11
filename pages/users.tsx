import Link from 'next/link';
import Layout from '../components/Layout';
import useFetch from '../lib/useFetch';
import { useChat } from '../contexts/ChatContext';
import { useState } from 'react';

export default function Users() {
  const { data } = useFetch<{ users: any[] }>('/api/users');
  const { openChat } = useChat();
  const [query, setQuery] = useState('');
  const users = (data?.users || []).filter(u =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Layout title="Users">
      <div className="max-w-screen-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <input
          type="text"
          placeholder="Search users..."
          className="input input-bordered w-full sm:max-w-xs"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {users.map(u => (
            <div key={u.id} className="card bg-base-100 shadow-system">
              <div className="p-4 flex flex-col items-center gap-2">
                {u.photo && (
                  <img
                    src={u.photo}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                )}
                <p className="font-semibold text-center truncate w-full">
                  {u.username}
                </p>
              </div>
              <div className="card-actions px-4 pb-4 flex gap-2">
                <Link href={`/profile/${u.username}`} className="btn btn-sm btn-outline flex-1">
                  View
                </Link>
                <button
                  className="btn btn-sm flex-1"
                  onClick={() => openChat(u.username)}
                >
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
